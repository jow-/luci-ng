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

#include <getopt.h>

#include "shared.h"

/* libipt*ext.so interfaces */
extern void init_extensions(void);
extern void init_extensions4(void);
extern void init_extensions6(void);

const char unsupported_rev[] = " [unsupported revision]";

/* stdout capture */

static char stdout_buffer[514];
static int stdout_save = -1;
static char *printf_output;

#ifndef NDEBUG
static int stderr_save = -1;
FILE *dbg;
#endif

/* xtables init structures */

void
iptables_exit_error(enum xtables_exittype status, const char *msg, ...)
{
#ifndef NDEBUG
	va_list args;
	if (dbg)
	{
		DPRINTF("xtables exit error %i\n", status);

		va_start(args, msg);
		vfprintf(dbg, msg, args);
		va_end(args);

		DPRINTF("\n");
	}
#endif
	exit(status); // kills rpcd!!
}

static struct option original_opts[] = {
	{ NULL },
};

struct xtables_globals iptables_globals = {
	.option_offset	 = 0,
	.program_version = "1",
	.program_name	 = "rpcd-mod-iptables",
	.orig_opts		 = original_opts,
	.exit_err		 = iptables_exit_error,
	.compat_rev		 = xtables_compatible_revision,
};

void
capture_stdout()
{
	int i;
	if (stdout_save != -1)
		return;

	// redirect stdout to buffer, to read the print function's output
	fflush(stdout);
	stdout_save = dup(STDOUT_FILENO);
	freopen("/dev/nul", "a", stdout);
	setvbuf(stdout, stdout_buffer, _IOFBF, 512);

	// find start of used buffer
	putc('O', stdout);
	printf_output = stdout_buffer;
	for (i = 0; *printf_output != 'O' && i <= 512; i++, printf_output++)
	{
	};
	fflush(stdout);

#ifndef NDEBUG
	dbg = fopen("/tmp/log/rpcd-mod-iptables", "w");
	setvbuf(dbg, NULL, _IONBF, 0);

	// redirect stderr for debugging
	fflush(stderr);
	stderr_save = dup(STDERR_FILENO);
	dup2(fileno(dbg), STDERR_FILENO); // redirect std err

	fprintf(stderr, "redirected stderr\n");
#endif
}

void
restore_stdout()
{
	if (stdout_save == -1)
		return;

	// restore stdout
	fflush(stdout);
	freopen("/dev/nul", "a", stdout);
	dup2(stdout_save, STDOUT_FILENO);
	close(stdout_save);
	setvbuf(stdout, NULL, _IONBF, 0);
	stdout_save = -1;

#ifndef NDEBUG
	fflush(stderr);
	freopen("/dev/nul", "a", stderr);
	dup2(stderr_save, STDERR_FILENO);
	close(stderr_save);
	setvbuf(stderr, NULL, _IONBF, 0);
	stderr_save = -1;

	fclose(dbg);
	dbg = NULL;
#endif
}

/** Add captured stdout output as string */
void
blobmsg_add_printf_output(struct blob_buf *buffer, char *key)
{
	putc('\0', stdout);
	blobmsg_add_string(buffer, key, printf_output);
	fflush(stdout);
}

/** Initilizes xtables and extensions */
int
mod_init_xtables(uint8_t nfproto)
{
	static int init = 0, init4 = 0, init6 = 0;
	int ret;

	capture_stdout();

	ret = xtables_init_all(&iptables_globals, nfproto);
	if (ret < 0)
	{
		DPRINTF("Error on xtables init\n");
		restore_stdout();
		return ret;
	}

	DPRINTF("Init proto IPv%s\n",
			nfproto == NFPROTO_IPV4 ? "4" : nfproto == NFPROTO_IPV6 ? "6" : "??");

	// only initialize extensions once
	if (!init)
	{
		init = 1;
		init_extensions();
		DPRINTF("Init shared extensions\n");
	}
	if (!init4 && nfproto == NFPROTO_IPV4)
	{
		init4 = 1;
		init_extensions4();
		DPRINTF("Init IPv4 extensions\n");
	}
	if (!init6 && nfproto == NFPROTO_IPV6)
	{
		init6 = 1;
		init_extensions6();
		DPRINTF("Init IPv6 extensions\n");
	}

	return ret;
}

void
mod_free()
{

	restore_stdout();
	xtables_free_opts(1);
}
