

export enum CaseStatus {
    Open = 'Open',
    Pending = 'Pending',
    Closed = 'Closed',
}

export interface Case {
    id: string;
    created_at: string;
    titulo: string;
    descripcion: string;
    estado: CaseStatus;
}
