/*
 * iptables - UBUS RPC iptables service
 *
 *   Copyright (C) 2020 Adrian Panella <ianchi74@outlook.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#define _GNU_SOURCE

#include <netdb.h>
#include <stdio.h>
#include <sys/stat.h>
#include <unistd.h>

#include <libiptc/libip6tc.h>

#include "shared.h"

static void
iptables6_blobmsg_ip(char *key, const struct in6_addr *ip, const struct in6_addr *mask,
					 int invert)
{
	u_int32_t cidr = 0;
	void *c;

	c = blobmsg_open_table(&buf, key);

	blobmsg_add_u8(&buf, "invert", invert);
	blobmsg_add_string(&buf, "address", xtables_ip6addr_to_numeric(ip));

	cidr = xtables_ip6mask_to_cidr(mask);
	if (cidr == (unsigned int)-1)
		/* mask was not a decent combination of 1's and 0's */
		blobmsg_add_string(&buf, "mask", xtables_ip6addr_to_numeric(mask));
	else
		blobmsg_add_u16(&buf, "mask", cidr);

	blobmsg_close_table(&buf, c);
}

static void
iptables6_blobmsg_proto(uint16_t proto, int invert)
{
	unsigned int i;
	struct protoent *pent = NULL;

	blobmsg_add_u8(&buf, "inv_proto", invert);
	if (!proto)
	{
		blobmsg_add_string(&buf, "proto", "*");
		return;
	}
	else
		pent = getprotobynumber(proto);

	if (pent)
	{
		blobmsg_add_string(&buf, "proto", pent->p_name);
		return;
	}

	for (i = 0; xtables_chain_protos[i].name != NULL; ++i)
		if (xtables_chain_protos[i].num == proto)
		{
			blobmsg_add_string(&buf, "proto", xtables_chain_protos[i].name);
			return;
		}
}

static int
iptables6_blobmsg_match(const struct xt_entry_match *m, const struct ip6t_ip6 *ip)
{
	const char *name   = m->u.user.name;
	const int revision = m->u.user.revision;
	struct xtables_match *match, *mt;
	void *c;

	c = blobmsg_open_table(&buf, NULL);
	blobmsg_add_string(&buf, "name", name);
	blobmsg_add_u32(&buf, "revision", revision);

	match = xtables_find_match(name, XTF_TRY_LOAD, NULL);
	if (match)
	{
		mt = xtables_find_match_revision(name, XTF_TRY_LOAD, match, revision);
		if (mt && mt->print)
		{
			mt->print(ip, m, 1);
			blobmsg_add_printf_output(&buf, "msg");
		}
		else if (match->print)
			blobmsg_printf(&buf, "msg", "%s%s ", match->name, unsupported_rev);
		else
			blobmsg_add_string(&buf, "msg", match->name);
	}
	else if (name[0])
		blobmsg_add_u8(&buf, "unknown", 1);

	blobmsg_close_table(&buf, c);
	/* Don't stop iterating. */
	return 0;
}

static void
iptables6_blobmsg_rule(const struct ip6t_entry *e, struct xtc_handle *h)
{
	struct xtables_target *target, *tg;
	const struct xt_entry_target *t;
	const char *targname;
	void *c;

	/* Print target name */
	targname = ip6tc_get_target(e, h);
	blobmsg_add_string(&buf, "target", targname);

	/* counters */
	blobmsg_add_u64(&buf, "bytes", e->counters.bcnt);
	blobmsg_add_u64(&buf, "packets", e->counters.pcnt);

	/* Print IP part. */
	iptables6_blobmsg_ip("src", &e->ipv6.src, &e->ipv6.smsk,
						 e->ipv6.invflags & IP6T_INV_SRCIP);
	iptables6_blobmsg_ip("dst", &e->ipv6.dst, &e->ipv6.dmsk,
						 e->ipv6.invflags & IP6T_INV_DSTIP);

	blobmsg_add_u8(&buf, "inv_in_iface", e->ipv6.invflags & IP6T_INV_VIA_IN);
	blobmsg_add_string(&buf, "in_iface",
					   e->ipv6.iniface[0] != '\0' ? e->ipv6.iniface : "*");
	blobmsg_add_u8(&buf, "inv_out_iface", e->ipv6.invflags & IP6T_INV_VIA_OUT);
	blobmsg_add_string(&buf, "out_iface",
					   e->ipv6.outiface[0] != '\0' ? e->ipv6.outiface : "*");

	iptables6_blobmsg_proto(e->ipv6.proto, e->ipv6.invflags & XT_INV_PROTO);

	/* no FRAG output on ipv6 */

	/* Print matchinfo part */
	if (e->target_offset)
	{
		c = blobmsg_open_array(&buf, "matches");
		IP6T_MATCH_ITERATE(e, iptables6_blobmsg_match, &e->ipv6);
		blobmsg_close_array(&buf, c);
	}

	/* Print targinfo part */

	if (!ip6tc_is_chain(targname, h))
	{
		blobmsg_add_u8(&buf, "isChainTarget", 0);
		target = xtables_find_target(targname, XTF_TRY_LOAD);
	}
	else
	{
		blobmsg_add_u8(&buf, "isChainTarget", 1);
		target = xtables_find_target(XT_STANDARD_TARGET, XTF_TRY_LOAD);
	}
	if (!target)
		DPRINTF("Could not find target %s\n", targname);
	t = ip6t_get_target((struct ip6t_entry *)e);

	if (target)
	{
		const int revision = t->u.user.revision;
		tg = xtables_find_target_revision(targname, XTF_TRY_LOAD, target, revision);
		if (tg && tg->print)
		{
			/* Print the target information. */
			tg->print(&e->ipv6, t, 1); // 1 TRUE = FMT_NUMERIC
			blobmsg_add_printf_output(&buf, "targinfo");
		}
		else if (target->print)
		{
			blobmsg_printf(&buf, "targinfo", " %s%s", target->name, unsupported_rev);
		}
	}
	else if (t->u.target_size != sizeof(*t))
	{
		blobmsg_printf(&buf, "targinfo", "[%u bytes of unknown target data] ",
					   (unsigned int)(t->u.target_size - sizeof(*t)));
	}
}

static void
iptables6_blobmsg_table(const char *tablename, struct xtc_handle *h)
{
	struct xt_counters counters;
	const struct ip6t_entry *entry;
	const char *chain = NULL, *name = NULL;
	void *c, *c_chain, *c_rules, *c_rule;
	unsigned int num = 0;

	c = blobmsg_open_array(&buf, tablename);

	for (chain = ip6tc_first_chain(h); chain; chain = ip6tc_next_chain(h))
	{

		c_chain = blobmsg_open_table(&buf, NULL);

		blobmsg_add_string(&buf, "chain", chain);
		blobmsg_add_u8(&buf, "builtin", ip6tc_builtin(chain, h));

		name = ip6tc_get_policy(chain, &counters, h);

		if (name)
		{
			blobmsg_add_string(&buf, "policy", name);
			blobmsg_add_u64(&buf, "bytes", counters.bcnt);
			blobmsg_add_u64(&buf, "packets", counters.pcnt);
		}
		else
		{
			unsigned int refs;
			if (ip6tc_get_references(&refs, chain, h))
				blobmsg_add_u32(&buf, "references", refs);
		}

		c_rules = blobmsg_open_array(&buf, "rules");

		for (entry = ip6tc_first_rule(chain, h), num = 0; entry;
			 entry = ip6tc_next_rule(entry, h), num++)
		{
			c_rule = blobmsg_open_table(&buf, NULL);

			blobmsg_add_u32(&buf, "num", num);
			iptables6_blobmsg_rule(entry, h);

			blobmsg_close_table(&buf, c_rule);
		}

		blobmsg_close_array(&buf, c_rules);
		blobmsg_close_table(&buf, c_chain);
	}

	blobmsg_close_array(&buf, c);
}

int
rpcd_mod_iptables_list6(struct ubus_context *ctx, struct ubus_object *obj,
						struct ubus_request_data *req, const char *method,
						struct blob_attr *msg)
{
	struct xtc_handle *h;
	char tablename[XT_TABLE_MAXNAMELEN];
	struct stat net_tables;

	if (mod_init_xtables(NFPROTO_IPV6) < 0)
		return UBUS_STATUS_UNKNOWN_ERROR;

	blob_buf_init(&buf, 0);

	if (stat("/proc/net/ip6_tables_names", &net_tables) == 0)
	{
		FILE *ftables = fopen("/proc/net/ip6_tables_names", "r");
		if (!ftables)
			goto error;

		while (fgets(tablename, sizeof(tablename), ftables))
		{
			size_t len = strlen(tablename);
			if (len && (tablename[len - 1] == '\n'))
				tablename[len - 1] = '\0';

			DPRINTF("Table: %s\n", tablename);

			/* try to insmod the module if ip6tc_init failed */
			h = ip6tc_init(tablename);
			if (!h && xtables_load_ko(xtables_modprobe_program, false) != -1)
				h = ip6tc_init(tablename);

			if (h)
			{
				iptables6_blobmsg_table(tablename, h);
				ip6tc_free(h);
			}
		}
		fclose(ftables);
	}

	mod_free();
	ubus_send_reply(ctx, req, buf.head);
	return 0;

error:
	DPRINTF("Unknown error\n");
	mod_free();
	return UBUS_STATUS_UNKNOWN_ERROR;
}
