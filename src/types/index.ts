export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    contact_email: string;
    shipping_address: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        zipCode: string;
    };
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string;
}

export interface FurnitureItem {
    id: string;
    type: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: [number, number, number];
    color?: string;
}

export interface SavedDesign {
    id: string;
    user_id: string;
    name: string;
    room_type: string;
    furniture_layout: FurnitureItem[];
    wall_color?: string;
    floor_color?: string;
    wall_texture?: string;
    lighting_mode?: string;
    custom_width?: number;
    custom_depth?: number;
    l_shape_ext_width?: number;
    l_shape_ext_depth?: number;
    l_shape_corner?: 'NE' | 'NW' | 'SE' | 'SW';
    light_pos_x?: number;
    light_pos_y?: number;
    light_pos_z?: number;
    created_at: string;
}
