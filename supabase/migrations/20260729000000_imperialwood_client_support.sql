-- Required by the direct Expo/Supabase client.
-- This migration alters the existing ImperialWood tables; it does not create them.

ALTER TABLE public."IW_Users"
  ADD COLUMN IF NOT EXISTS "auth_user_id" UUID UNIQUE
  REFERENCES auth.users ("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "IW_Users_username_key"
  ON public."IW_Users" ("username");

CREATE UNIQUE INDEX IF NOT EXISTS "IW_Users_email_key"
  ON public."IW_Users" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "IW_Carts_user_id_key"
  ON public."IW_Carts" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "IW_Cart_Items_cart_product_key"
  ON public."IW_Cart_Items" ("cart_id", "product_id");

CREATE UNIQUE INDEX IF NOT EXISTS "IW_Favorites_user_product_key"
  ON public."IW_Favorites" ("user_id", "product_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Products_category_id_fkey'
      AND conrelid = 'public."IW_Products"'::regclass
  ) THEN
    ALTER TABLE public."IW_Products"
      ADD CONSTRAINT "IW_Products_category_id_fkey"
      FOREIGN KEY ("category_id")
      REFERENCES public."IW_Categories" ("category_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Store_Photos_store_id_fkey'
      AND conrelid = 'public."IW_Store_Photos"'::regclass
  ) THEN
    ALTER TABLE public."IW_Store_Photos"
      ADD CONSTRAINT "IW_Store_Photos_store_id_fkey"
      FOREIGN KEY ("store_id")
      REFERENCES public."IW_Stores" ("store_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Store_Inventory_store_id_fkey'
      AND conrelid = 'public."IW_Store_Inventory"'::regclass
  ) THEN
    ALTER TABLE public."IW_Store_Inventory"
      ADD CONSTRAINT "IW_Store_Inventory_store_id_fkey"
      FOREIGN KEY ("store_id")
      REFERENCES public."IW_Stores" ("store_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Store_Inventory_product_id_fkey'
      AND conrelid = 'public."IW_Store_Inventory"'::regclass
  ) THEN
    ALTER TABLE public."IW_Store_Inventory"
      ADD CONSTRAINT "IW_Store_Inventory_product_id_fkey"
      FOREIGN KEY ("product_id")
      REFERENCES public."IW_Products" ("product_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Favorites_user_id_fkey'
      AND conrelid = 'public."IW_Favorites"'::regclass
  ) THEN
    ALTER TABLE public."IW_Favorites"
      ADD CONSTRAINT "IW_Favorites_user_id_fkey"
      FOREIGN KEY ("user_id")
      REFERENCES public."IW_Users" ("user_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Favorites_product_id_fkey'
      AND conrelid = 'public."IW_Favorites"'::regclass
  ) THEN
    ALTER TABLE public."IW_Favorites"
      ADD CONSTRAINT "IW_Favorites_product_id_fkey"
      FOREIGN KEY ("product_id")
      REFERENCES public."IW_Products" ("product_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Carts_user_id_fkey'
      AND conrelid = 'public."IW_Carts"'::regclass
  ) THEN
    ALTER TABLE public."IW_Carts"
      ADD CONSTRAINT "IW_Carts_user_id_fkey"
      FOREIGN KEY ("user_id")
      REFERENCES public."IW_Users" ("user_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Cart_Items_cart_id_fkey'
      AND conrelid = 'public."IW_Cart_Items"'::regclass
  ) THEN
    ALTER TABLE public."IW_Cart_Items"
      ADD CONSTRAINT "IW_Cart_Items_cart_id_fkey"
      FOREIGN KEY ("cart_id")
      REFERENCES public."IW_Carts" ("cart_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Cart_Items_product_id_fkey'
      AND conrelid = 'public."IW_Cart_Items"'::regclass
  ) THEN
    ALTER TABLE public."IW_Cart_Items"
      ADD CONSTRAINT "IW_Cart_Items_product_id_fkey"
      FOREIGN KEY ("product_id")
      REFERENCES public."IW_Products" ("product_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Orders_user_id_fkey'
      AND conrelid = 'public."IW_Orders"'::regclass
  ) THEN
    ALTER TABLE public."IW_Orders"
      ADD CONSTRAINT "IW_Orders_user_id_fkey"
      FOREIGN KEY ("user_id")
      REFERENCES public."IW_Users" ("user_id");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Order_Items_order_id_fkey'
      AND conrelid = 'public."IW_Order_Items"'::regclass
  ) THEN
    ALTER TABLE public."IW_Order_Items"
      ADD CONSTRAINT "IW_Order_Items_order_id_fkey"
      FOREIGN KEY ("order_id")
      REFERENCES public."IW_Orders" ("order_id")
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'IW_Order_Items_product_id_fkey'
      AND conrelid = 'public."IW_Order_Items"'::regclass
  ) THEN
    ALTER TABLE public."IW_Order_Items"
      ADD CONSTRAINT "IW_Order_Items_product_id_fkey"
      FOREIGN KEY ("product_id")
      REFERENCES public."IW_Products" ("product_id");
  END IF;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    WHERE c.conname = 'IW_Store_Photos_store_id_fkey'
      AND c.contype = 'f'
      AND c.conrelid = 'public."IW_Store_Photos"'::regclass
      AND c.confrelid = 'public."IW_Stores"'::regclass
      AND c.conkey = ARRAY[
        (
          SELECT a.attnum
          FROM pg_attribute AS a
          WHERE a.attrelid = 'public."IW_Store_Photos"'::regclass
            AND a.attname = 'store_id'
        )
      ]::smallint[]
      AND c.confkey = ARRAY[
        (
          SELECT a.attnum
          FROM pg_attribute AS a
          WHERE a.attrelid = 'public."IW_Stores"'::regclass
            AND a.attname = 'store_id'
        )
      ]::smallint[]
  )
  AND EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    WHERE c.conname = 'fk_iw_store_photos_store'
      AND c.contype = 'f'
      AND c.conrelid = 'public."IW_Store_Photos"'::regclass
      AND c.confrelid = 'public."IW_Stores"'::regclass
      AND c.conkey = ARRAY[
        (
          SELECT a.attnum
          FROM pg_attribute AS a
          WHERE a.attrelid = 'public."IW_Store_Photos"'::regclass
            AND a.attname = 'store_id'
        )
      ]::smallint[]
      AND c.confkey = ARRAY[
        (
          SELECT a.attnum
          FROM pg_attribute AS a
          WHERE a.attrelid = 'public."IW_Stores"'::regclass
            AND a.attname = 'store_id'
        )
      ]::smallint[]
  ) THEN
    ALTER TABLE public."IW_Store_Photos"
      DROP CONSTRAINT "fk_iw_store_photos_store";
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.iw_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."IW_Users" AS u
    WHERE u."auth_user_id" = auth.uid()
      AND u."role" = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.iw_resolve_login(
  p_username text,
  p_role text
)
RETURNS TABLE ("email" text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u."email"::text AS "email"
  FROM public."IW_Users" AS u
  WHERE lower(u."username"::text) = lower(trim(p_username))
    AND u."role"::text = CASE
      WHEN p_role = 'admin' THEN 'admin'
      ELSE 'client'
    END
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.iw_resolve_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.iw_resolve_login(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.iw_create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."IW_Users" (
    "auth_user_id",
    "full_name",
    "username",
    "email",
    "phone",
    "role",
    "created_at"
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' = 'admin' THEN 'admin'
      ELSE 'client'
    END,
    NEW.created_at
  )
  ON CONFLICT ("auth_user_id") DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS iw_auth_user_profile ON auth.users;

CREATE TRIGGER iw_auth_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.iw_create_user_profile();

CREATE OR REPLACE FUNCTION public.iw_checkout()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid := auth.uid();
  v_user_id public."IW_Users"."user_id"%TYPE;
  v_recipient_name public."IW_Orders"."recipient_name"%TYPE;
  v_recipient_phone public."IW_Orders"."recipient_phone"%TYPE;
  v_store_id public."IW_Stores"."store_id"%TYPE;
  v_cart_id public."IW_Carts"."cart_id"%TYPE;
  v_order_id public."IW_Orders"."order_id"%TYPE;
  v_order_number public."IW_Orders"."order_number"%TYPE;
  v_subtotal numeric;
  v_shipping_fee numeric := 0;
  v_total_amount numeric;
  v_order_status public."IW_Orders"."order_status"%TYPE;
  v_created_at timestamptz;
  v_items jsonb;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    u."user_id",
    COALESCE(NULLIF(u."full_name", ''), u."username"),
    COALESCE(u."phone", '')
  INTO
    v_user_id,
    v_recipient_name,
    v_recipient_phone
  FROM public."IW_Users" AS u
  WHERE u."auth_user_id" = v_auth_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ImperialWood user profile not found';
  END IF;

  SELECT c."cart_id"
  INTO v_cart_id
  FROM public."IW_Carts" AS c
  WHERE c."user_id" = v_user_id
    AND c."cart_status" = 'active'
  ORDER BY c."cart_id" DESC
  LIMIT 1
  FOR UPDATE;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT SUM(ci."quantity"::numeric * ci."unit_price"::numeric)
  INTO v_subtotal
  FROM public."IW_Cart_Items" AS ci
  WHERE ci."cart_id" = v_cart_id;

  IF v_subtotal IS NULL THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT s."store_id"
  INTO v_store_id
  FROM public."IW_Stores" AS s
  WHERE s."store_status" = 'active'
  ORDER BY s."store_id"
  LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No active store is available';
  END IF;

  v_created_at := clock_timestamp();
  v_order_number := 'IW-' || (
    EXTRACT(EPOCH FROM v_created_at) * 1000
  )::bigint::text;
  v_total_amount := v_subtotal + v_shipping_fee;

  INSERT INTO public."IW_Orders" (
    "order_number",
    "user_id",
    "store_id",
    "order_date",
    "subtotal",
    "shipping_fee",
    "total_amount",
    "payment_method",
    "payment_status",
    "order_status",
    "recipient_name",
    "recipient_phone",
    "shipping_address",
    "tracking_number",
    "created_at",
    "updated_at"
  )
  VALUES (
    v_order_number,
    v_user_id,
    v_store_id,
    v_created_at,
    v_subtotal,
    v_shipping_fee,
    v_total_amount,
    'cash_on_delivery',
    'pending',
    'confirmed',
    v_recipient_name,
    v_recipient_phone,
    'Store pickup',
    NULL,
    v_created_at,
    v_created_at
  )
  RETURNING "order_id", "order_status"
  INTO v_order_id, v_order_status;

  BEGIN
    INSERT INTO public."IW_Order_Items" (
      "order_id",
      "product_id",
      "product_name",
      "quantity",
      "unit_price",
      "line_total"
    )
    SELECT
      v_order_id,
      ci."product_id",
      p."product_name",
      ci."quantity",
      ci."unit_price"::numeric,
      ci."quantity"::numeric * ci."unit_price"::numeric
    FROM public."IW_Cart_Items" AS ci
    JOIN public."IW_Products" AS p
      ON p."product_id" = ci."product_id"
    WHERE ci."cart_id" = v_cart_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'IW_Order_Items insert failed: %', SQLERRM;
  END;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'product_id', oi."product_id",
        'product_name', oi."product_name",
        'quantity', oi."quantity",
        'unit_price', oi."unit_price",
        'line_total', oi."line_total"
      )
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM public."IW_Order_Items" AS oi
  WHERE oi."order_id" = v_order_id;

  DELETE FROM public."IW_Cart_Items" AS ci
  WHERE ci."cart_id" = v_cart_id;

  UPDATE public."IW_Carts" AS c
  SET "cart_status" = 'ordered'
  WHERE c."cart_id" = v_cart_id;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'user_id', v_user_id,
    'total_amount', v_total_amount,
    'order_status', v_order_status,
    'created_at', v_created_at,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.iw_checkout() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.iw_checkout() TO authenticated;

ALTER TABLE public."IW_Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Store_Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Store_Photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Cart_Items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IW_Order_Items" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "iw_users_select" ON public."IW_Users";
CREATE POLICY "iw_users_select"
  ON public."IW_Users"
  FOR SELECT
  TO authenticated
  USING ("auth_user_id" = auth.uid() OR public.iw_is_admin());

DROP POLICY IF EXISTS "iw_users_insert" ON public."IW_Users";
CREATE POLICY "iw_users_insert"
  ON public."IW_Users"
  FOR INSERT
  TO authenticated
  WITH CHECK ("auth_user_id" = auth.uid());

DROP POLICY IF EXISTS "iw_users_update" ON public."IW_Users";
CREATE POLICY "iw_users_update"
  ON public."IW_Users"
  FOR UPDATE
  TO authenticated
  USING ("auth_user_id" = auth.uid())
  WITH CHECK ("auth_user_id" = auth.uid());

DROP POLICY IF EXISTS "iw_categories_read" ON public."IW_Categories";
CREATE POLICY "iw_categories_read"
  ON public."IW_Categories"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "iw_categories_admin" ON public."IW_Categories";
CREATE POLICY "iw_categories_admin"
  ON public."IW_Categories"
  FOR ALL
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_products_read" ON public."IW_Products";
CREATE POLICY "iw_products_read"
  ON public."IW_Products"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "iw_products_admin" ON public."IW_Products";
CREATE POLICY "iw_products_admin"
  ON public."IW_Products"
  FOR ALL
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_stores_read" ON public."IW_Stores";
CREATE POLICY "iw_stores_read"
  ON public."IW_Stores"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "iw_stores_admin" ON public."IW_Stores";
CREATE POLICY "iw_stores_admin"
  ON public."IW_Stores"
  FOR ALL
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_store_photos_read" ON public."IW_Store_Photos";
CREATE POLICY "iw_store_photos_read"
  ON public."IW_Store_Photos"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "iw_store_photos_admin" ON public."IW_Store_Photos";
CREATE POLICY "iw_store_photos_admin"
  ON public."IW_Store_Photos"
  FOR ALL
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_inventory_read" ON public."IW_Store_Inventory";
CREATE POLICY "iw_inventory_read"
  ON public."IW_Store_Inventory"
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "iw_inventory_admin" ON public."IW_Store_Inventory";
CREATE POLICY "iw_inventory_admin"
  ON public."IW_Store_Inventory"
  FOR ALL
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_favorites_own" ON public."IW_Favorites";
CREATE POLICY "iw_favorites_own"
  ON public."IW_Favorites"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."IW_Users" AS u
      WHERE u."user_id" = "IW_Favorites"."user_id"
        AND u."auth_user_id" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."IW_Users" AS u
      WHERE u."user_id" = "IW_Favorites"."user_id"
        AND u."auth_user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "iw_carts_own" ON public."IW_Carts";
CREATE POLICY "iw_carts_own"
  ON public."IW_Carts"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."IW_Users" AS u
      WHERE u."user_id" = "IW_Carts"."user_id"
        AND u."auth_user_id" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."IW_Users" AS u
      WHERE u."user_id" = "IW_Carts"."user_id"
        AND u."auth_user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "iw_cart_items_own" ON public."IW_Cart_Items";
CREATE POLICY "iw_cart_items_own"
  ON public."IW_Cart_Items"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."IW_Carts" AS c
      JOIN public."IW_Users" AS u
        ON u."user_id" = c."user_id"
      WHERE c."cart_id" = "IW_Cart_Items"."cart_id"
        AND u."auth_user_id" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public."IW_Carts" AS c
      JOIN public."IW_Users" AS u
        ON u."user_id" = c."user_id"
      WHERE c."cart_id" = "IW_Cart_Items"."cart_id"
        AND u."auth_user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "iw_orders_read" ON public."IW_Orders";
CREATE POLICY "iw_orders_read"
  ON public."IW_Orders"
  FOR SELECT
  TO authenticated
  USING (
    public.iw_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public."IW_Users" AS u
      WHERE u."user_id" = "IW_Orders"."user_id"
        AND u."auth_user_id" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "iw_orders_admin_update" ON public."IW_Orders";
CREATE POLICY "iw_orders_admin_update"
  ON public."IW_Orders"
  FOR UPDATE
  TO authenticated
  USING (public.iw_is_admin())
  WITH CHECK (public.iw_is_admin());

DROP POLICY IF EXISTS "iw_order_items_read" ON public."IW_Order_Items";
CREATE POLICY "iw_order_items_read"
  ON public."IW_Order_Items"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public."IW_Orders" AS o
      JOIN public."IW_Users" AS u
        ON u."user_id" = o."user_id"
      WHERE o."order_id" = "IW_Order_Items"."order_id"
        AND (u."auth_user_id" = auth.uid() OR public.iw_is_admin())
    )
  );
