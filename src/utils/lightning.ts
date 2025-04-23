export function isValidLightningAddress(address: string): boolean {
	// Basic format: local-part@domain
	const basicFormat = /^[^@]+@[^@]+\.[^@]+$/;
	if (!basicFormat.test(address)) return false;

	try {
		// Construct the corresponding LNURL metadata fetch URL
		const [name, domain] = address.split("@");
		const url = `https://${domain}/.well-known/lnurlp/${name}`;

		// Basic URL validation
		new URL(url);
		return true;
	} catch {
		return false;
	}
}
