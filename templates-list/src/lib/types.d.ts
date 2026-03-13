export type TemplateItem = {
    template_id: number;
    template_version: number;
}

export type TemplateEntry = {
    user_email: string;
    template_name: string;
    templates: TemplateItem[];
}