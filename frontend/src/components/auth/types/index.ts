export interface AuthInputProps {
    placeholder: string,
    name: string,
    type: string,
    value?: string,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    disabled?: boolean,
    children?: any
}