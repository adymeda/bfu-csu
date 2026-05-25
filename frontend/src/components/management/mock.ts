import type { ManagementGroup, ManagementUser } from "./types"

export const MOCK_USERS: ManagementUser[] = [
    {
        id: 1,
        display_name: "Ишанов Сергей Александрович",
        accent_color: "21145f",
        image: "https://kantiana.ru/upload/sotbit_speedpage/webp/resize_cache/iblock/78d/i0dv87vm1g80qmqog6q2g40xxywpojif/240_240_2/1671629880472_01.webp",
        groups: [
            {
                id: 1,
                label: "Высшая школа компьютерных наук и искусственного интеллекта",
                children: [
                    {
                        id: 2,
                        label: "Прикладная математика и информатика",
                        members: [
                            { display_name: "Ишанов Сергей Александрович", accent_color: "21145f" }
                        ],
                        children: [
                            {
                                id: 3,
                                label: "Преподаватели",
                                members: [
                                    { display_name: "Ишанов Сергей Александрович", accent_color: "21145f" }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        display_name: "Кулдышев Никита Андреевич",
        accent_color: "8b1a4a",
        groups: [
            {
                id: 1,
                label: "Высшая школа компьютерных наук и искусственного интеллекта",
                children: [
                    {
                        id: 2,
                        label: "Прикладная математика и информатика",
                        children: [
                            {
                                id: 5,
                                label: "4ПМ АДМО",
                                members: [
                                    { display_name: "Кулдышев Никита Андреевич", accent_color: "8b1a4a"}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 3,
        display_name: "Савкин Дмитрий Александрович",
        accent_color: "1a6b3c",
        groups: [
            {
                id: 1,
                label: "Высшая школа компьютерных наук и искусственного интеллекта",
                children: [
                    {
                        id: 2,
                        label: "Прикладная математика и информатика",
                        members: [
                            { display_name: "Савкин Дмитрий Александрович", accent_color: "1a6b3c", isAdmin: true }
                        ],
                        children: [
                            {
                                id: 3,
                                label: "Преподаватели",
                                members: [
                                    { display_name: "Савкин Дмитрий Александрович", accent_color: "1a6b3c", isAdmin: true }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
]

export const MOCK_GROUPS: ManagementGroup[] = [
    {
        id: 1,
        name: "Высшая школа компьютерных наук и искусственного интеллекта",
        parent_id: null,
        members: []
    },
    {
        id: 2,
        name: "Прикладная математика и информатика",
        parent_id: 1,
        members: [
            { id: 1, display_name: "Ишанов Сергей Александрович", isAdmin: false, accent_color: "21145f" },
            { id: 3, display_name: "Савкин Дмитрий Александрович", isAdmin: true, accent_color: "1a6b3c" }
        ]
    },
    {
        id: 3,
        name: "Преподаватели",
        parent_id: 2,
        members: [
            { id: 1, display_name: "Ишанов Сергей Александрович", isAdmin: false, accent_color: "21145f" },
            { id: 3, display_name: "Савкин Дмитрий Александрович", isAdmin: true, accent_color: "1a6b3c" }
        ]
    },
    {
        id: 4,
        name: "4ПМ АДМО",
        parent_id: 2,
        members: [
            { id: 2, display_name: "Кулдышев Никита Андреевич", isAdmin: false, accent_color: "8b1a4a" }
        ]
    },
    {
        id: 5,
        name: "Высшая школа бизнеса и предпринимательства",
        parent_id: null,
        members: []
    },
    {
        id: 6,
        name: "Экономика и менеджмент",
        parent_id: 5,
        members: []
    },
    {
        id: 7,
        name: "2ММ",
        parent_id: 6,
        members: [
            { id: 4, display_name: "Петрова Мария Сергеевна", isAdmin: true, accent_color: "8b1a4a" }
        ]
    }
]
