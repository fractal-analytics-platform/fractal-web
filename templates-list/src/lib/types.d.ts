export type TemplateItem = {
    template_id: number;
    template_version: number;
}

export type TemplateEntry = {
    template_name: string;
    templates: TemplateItem[];
}