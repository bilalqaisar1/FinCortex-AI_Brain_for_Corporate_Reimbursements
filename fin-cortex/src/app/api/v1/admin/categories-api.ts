export interface Subcategory {
    subcategory_id: number;
    subcategory_name: string;
    category_id: number;
    description?: string;
    created_at?: string;
}

export interface Category {
    category_id: number;
    category_name: string;
    company_id?: number | null;
    description?: string;
    created_at?: string;
    subcategories?: Subcategory[];
}

export interface CreateCategoryInput {
    category_name: string;
    company_id?: number | null;
    description?: string;
}

export interface CreateSubcategoryInput {
    subcategory_name: string;
    category_id: number;
    description?: string;
}

// Helper to get the base URL
const getBaseUrl = () => {
    // In production, this would be an environment variable
    return "http://localhost:8000/api/v1";
};

export async function fetchCategories(companyId?: number): Promise<Category[]> {
    try {
        let url = `${getBaseUrl()}/categories`;
        if (companyId) {
            url += `?company_id=${companyId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    try {
        const response = await fetch(`${getBaseUrl()}/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(`Failed to create category: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
}

export async function createSubcategory(input: CreateSubcategoryInput): Promise<Subcategory> {
    try {
        const response = await fetch(`${getBaseUrl()}/subcategories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(`Failed to create subcategory: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error creating subcategory:", error);
        throw error;
    }
}

export async function deleteCategory(categoryId: number): Promise<void> {
    try {
        const response = await fetch(`${getBaseUrl()}/categories/${categoryId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            let errorMessage = `Failed to delete category: ${response.statusText}`;
            try {
                const errorData = await response.json();
                // Prefer 'detail' from FastAPI/HTTPException
                if (errorData.detail) errorMessage = errorData.detail;
                else if (errorData.message) errorMessage = errorData.message;
            } catch (e) {
                // If response is not JSON, use default statusText
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}

export async function deleteSubcategory(subcategoryId: number): Promise<void> {
    try {
        const response = await fetch(`${getBaseUrl()}/subcategories/${subcategoryId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            let errorMessage = `Failed to delete subcategory: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMessage = errorData.detail;
                else if (errorData.message) errorMessage = errorData.message;
            } catch (e) {
                // ignore
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        throw error;
    }
}
