"use client";

import * as React from "react";
import type { Category } from "@/types";
import { toast } from "sonner";

export function useCategories(isAuthenticated: boolean) {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!isAuthenticated) return;

        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories || []);
                } else {
                    console.error("Failed to fetch categories");
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchCategories();
    }, [isAuthenticated]);

    return { categories, isLoading };
}
