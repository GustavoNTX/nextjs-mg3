export const formatCNPJ = (value = "") => {
    const digits = value.replace(/\D/g, "").slice(0, 14);

    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
};

export const isValidCNPJ = (cnpj) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;

    const calc = (base, weights) => {
        const sum = weights.reduce(
            (acc, w, i) => acc + parseInt(base[i], 10) * w,
            0
        );
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    };

    const base12 = cleaned.slice(0, 12);
    const d1 = calc(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = calc(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return cleaned === base12 + d1 + d2;
};
