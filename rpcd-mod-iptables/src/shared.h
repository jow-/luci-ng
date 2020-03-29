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

#include <ctype.h>
#include <stdio.h>
#include <xtables.h>

#include <libubox/blobmsg.h>
#include <libubus.h>

#undef NDEBUG

#ifndef NDEBUG
#define DPRINTF(...) fprintf(dbg, __VA_ARGS__)
#else
#define DPRINTF(...)
#endif

extern struct blob_buf buf;
extern const char unsupported_rev[24];
extern FILE *dbg;

void iptables_exit_error(enum xtables_exittype status, const char *msg, ...)
	__attribute__((noreturn, format(printf, 2, 3)));

void capture_stdout();
void restore_stdout();
void blobmsg_add_printf_output(struct blob_buf *buffer, char *key);

int mod_init_xtables(uint8_t nfproto);
void mod_free();

int rpcd_mod_iptables_list(struct ubus_context *ctx, struct ubus_object *obj,
						   struct ubus_request_data *req, const char *method,
						   struct blob_attr *msg);

int rpcd_mod_iptables_list6(struct ubus_context *ctx, struct ubus_object *obj,
							struct ubus_request_data *req, const char *method,
							struct blob_attr *msg);
