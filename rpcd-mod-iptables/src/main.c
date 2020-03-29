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

#include "shared.h"
#include <rpcd/plugin.h>

struct blob_buf buf;
static const struct rpc_daemon_ops *ops;

static int
rpc_iptables_api_init(const struct rpc_daemon_ops *o, struct ubus_context *ctx)
{
	int rv = 0;

	static const struct ubus_method mod_iptables_methods[] = {
		UBUS_METHOD_NOARG("list", rpcd_mod_iptables_list),
		UBUS_METHOD_NOARG("list6", rpcd_mod_iptables_list6),
	};

	static struct ubus_object_type mod_iptables_type =
		UBUS_OBJECT_TYPE("rpcd-mod-iptables", mod_iptables_methods);

	static struct ubus_object mod_iptables_obj = {
		.name	   = "iptables",
		.type	   = &mod_iptables_type,
		.methods   = mod_iptables_methods,
		.n_methods = ARRAY_SIZE(mod_iptables_methods),
	};

	ops = o;

	rv |= ubus_add_object(ctx, &mod_iptables_obj);

	return rv;
}

struct rpc_plugin rpc_plugin = { .init = rpc_iptables_api_init };