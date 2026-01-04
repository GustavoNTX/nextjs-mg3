"use client";

import { useEffect, useState } from "react";

export function useIBGELocations(selectedUF) {
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        setLoadingStates(true);
        fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
            .then((res) => res.json())
            .then((data) => {
                const ordered = data
                    .map((s) => ({ uf: s.sigla, name: s.nome }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                setStates(ordered);
            })
            .finally(() => setLoadingStates(false));
    }, []);

    useEffect(() => {
        if (!selectedUF) {
            setCities([]);
            return;
        }

        setLoadingCities(true);
        fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
        )
            .then((res) => res.json())
            .then((data) => {
                setCities(data.map((c) => c.nome));
            })
            .finally(() => setLoadingCities(false));
    }, [selectedUF]);

    return { states, cities, loadingStates, loadingCities };
}
