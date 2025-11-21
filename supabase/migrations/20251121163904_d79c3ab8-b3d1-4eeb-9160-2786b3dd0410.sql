-- Add merchant_active flag to rooms table
ALTER TABLE public.rooms 
ADD COLUMN merchant_active BOOLEAN NOT NULL DEFAULT false;

-- Add a flag to mark items as currently available
ALTER TABLE public.merchant_items
ADD COLUMN available BOOLEAN NOT NULL DEFAULT true;