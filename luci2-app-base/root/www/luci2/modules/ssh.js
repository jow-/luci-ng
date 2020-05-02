function lengthDecode(s, off) {
  const l =
    (s.charCodeAt(off++) << 24) |
    (s.charCodeAt(off++) << 16) |
    (s.charCodeAt(off++) << 8) |
    s.charCodeAt(off++);

  if (l < 0 || off + l > s.length) return -1;

  return l;
}

export function decode(raw) {
  if (typeof raw !== 'string') return null;
  raw = raw.trim();
  let parts = raw.split(/\s+/);
  if (parts.length < 2) return null;

  let key = null;
  try {
    raw = atob(parts[1]);
  } catch (e) {}
  if (!raw) return null;

  let off, len;

  off = 0;
  len = lengthDecode(raw, off);

  if (len <= 0) return null;

  let type = raw.substr(off + 4, len);
  if (type !== parts[0]) return null;

  off += 4 + len;

  let len1 = off < raw.length ? lengthDecode(raw, off) : 0;
  if (len1 <= 0) return null;

  let curve = null;
  if (type.indexOf('ecdsa-sha2-') === 0) {
    curve = raw.substr(off + 4, len1);

    if (!len1 || type.substr(11) !== curve) return null;

    type = 'ecdsa-sha2';
    curve = curve.replace(/^nistp(\d+)$/, 'NIST P-$1');
  }

  off += 4 + len1;

  let len2 = off < raw.length ? lengthDecode(raw, off) : 0;
  if (len2 < 0) return null;

  if (len1 & 1) len1--;

  if (len2 & 1) len2--;

  let comment = parts.slice(2).join(' ');
  let ending = parts[1].substr(-8);

  switch (type) {
    case 'ssh-rsa':
      return { type: 'RSA', bits: len2 * 8, comment, ending, raw: raw };

    case 'ssh-dss':
      return { type: 'DSA', bits: len1 * 8, comment, ending, raw: raw };

    case 'ssh-ed25519':
      return { type: 'ECDH', curve: 'Curve25519', comment, ending, raw: raw };

    case 'ecdsa-sha2':
      return { type: 'ECDSA', curve: curve, comment, ending, raw: raw };

    default:
      return null;
  }
}
