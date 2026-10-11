/** Panel araçlarının ortak istek yardımcısı: başarısız yanıtta sunucunun Türkçe hata mesajını fırlatır. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, { cache: "no-store", ...init });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || "İşlem başarısız.");
	return data as T;
}
