-- ==============================================================================
-- LAKSHMI SATYANARAYANA ERP — COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Production-Ready Schema: Tables, Enums, Constraints, Triggers, RLS & Functions
-- ==============================================================================

-- ==============================================================================
-- PART 1: EXTENSIONS & ENUM TYPES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safe ENUM Creation using DO blocks
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'associate', 'gst');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE distributor_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bill_status AS ENUM ('paid', 'pending', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bill_type AS ENUM ('normal', 'gst');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('cash', 'upi', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE points_calculation AS ENUM ('add', 'subtract');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_transaction_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM ('received', 'pending', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_transaction_calc AS ENUM ('sum', 'subtract');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- PART 2: HELPER FUNCTIONS (TIMESTAMPS & SECURITY DEFINER FOR RLS)
-- ==============================================================================

-- 1. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Role lookup helper without RLS recursion
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Boolean Role Check Helpers
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_associate()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_current_user_role() = 'associate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_gst()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_current_user_role() = 'gst');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- PART 3: APPLICATION TABLES (14 EXACT TABLES)
-- ==============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    role user_role NOT NULL DEFAULT 'associate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ASSOCIATES
CREATE TABLE IF NOT EXISTS public.associates (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    associate_id VARCHAR(50) UNIQUE NOT NULL,
    current_points INTEGER NOT NULL DEFAULT 0 CHECK (current_points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    status customer_status NOT NULL DEFAULT 'active',
    available_points DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (available_points >= 0),
    credit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    address TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. REWARDS
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    points INTEGER NOT NULL CHECK (points > 0),
    reward_url TEXT NULL,
    status reward_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. REWARD_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE RESTRICT,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
    points INTEGER NOT NULL CHECK (points > 0),
    status reward_transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) UNIQUE NOT NULL,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    status category_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    product_id VARCHAR(50) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (quantity >= 0),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    discount DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (mrp >= 0),
    low_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (low_stock >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'Piece',
    status product_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. BILLS
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL,
    associate_id UUID NULL REFERENCES public.associates(id) ON DELETE SET NULL,
    sub_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (sub_total >= 0),
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (taxable_amount >= 0),
    gst DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (gst >= 0),
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    status bill_status NOT NULL DEFAULT 'pending',
    type bill_type NOT NULL DEFAULT 'normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ASSOCIATE_P_TRANS (Points ledger referencing bills)
CREATE TABLE IF NOT EXISTS public.associate_p_trans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE RESTRICT,
    points INTEGER NOT NULL CHECK (points > 0),
    calc points_calculation NOT NULL,
    balance_points INTEGER NOT NULL CHECK (balance_points >= 0),
    bill_id UUID NULL REFERENCES public.bills(id) ON DELETE SET NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. BILL_ITEMS
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (mrp >= 0),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    discount DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    row_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (row_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    type payment_type NOT NULL DEFAULT 'cash',
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DISTRIBUTORS
CREATE TABLE IF NOT EXISTS public.distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id VARCHAR(50) UNIQUE NOT NULL,
    distributor_name VARCHAR(150) NOT NULL,
    address TEXT NULL,
    mobile VARCHAR(15) NULL,
    gstin VARCHAR(15) NULL,
    status distributor_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id VARCHAR(50) UNIQUE NOT NULL,
    distributor_id UUID NOT NULL REFERENCES public.distributors(id) ON DELETE RESTRICT,
    total_products INTEGER NOT NULL DEFAULT 0 CHECK (total_products >= 0),
    total_items DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_items >= 0),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    status purchase_status NOT NULL DEFAULT 'received',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. PURCHASE_ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (mrp >= 0),
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    row_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (row_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. CUSTOMER_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    bill_id UUID NULL REFERENCES public.bills(id) ON DELETE SET NULL,
    calculation customer_transaction_calc NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    type payment_type NOT NULL DEFAULT 'cash',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- PART 4: INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_associates_associate_id ON public.associates(associate_id);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);

CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_id ON public.customer_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_created_at ON public.customer_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_associate_id ON public.reward_transactions(associate_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_reward_id ON public.reward_transactions(reward_id);

CREATE INDEX IF NOT EXISTS idx_categories_category_id ON public.categories(category_id);

CREATE INDEX IF NOT EXISTS idx_products_product_id ON public.products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

CREATE INDEX IF NOT EXISTS idx_bills_bill_id ON public.bills(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_associate_id ON public.bills(associate_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_type ON public.bills(type);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);

CREATE INDEX IF NOT EXISTS idx_associate_p_trans_associate_id ON public.associate_p_trans(associate_id);
CREATE INDEX IF NOT EXISTS idx_associate_p_trans_bill_id ON public.associate_p_trans(bill_id);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON public.bill_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments(bill_id);

CREATE INDEX IF NOT EXISTS idx_distributors_distributor_id ON public.distributors(distributor_id);

CREATE INDEX IF NOT EXISTS idx_purchases_purchase_id ON public.purchases(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchases_distributor_id ON public.purchases(distributor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON public.purchase_items(product_id);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);

-- ==============================================================================
-- PART 5: TRIGGERS (UPDATED_AT)
-- ==============================================================================
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_associates_updated_at ON public.associates;
CREATE TRIGGER trigger_associates_updated_at BEFORE UPDATE ON public.associates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_rewards_updated_at ON public.rewards;
CREATE TRIGGER trigger_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_reward_transactions_updated_at ON public.reward_transactions;
CREATE TRIGGER trigger_reward_transactions_updated_at BEFORE UPDATE ON public.reward_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_bills_updated_at ON public.bills;
CREATE TRIGGER trigger_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_bill_items_updated_at ON public.bill_items;
CREATE TRIGGER trigger_bill_items_updated_at BEFORE UPDATE ON public.bill_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_distributors_updated_at ON public.distributors;
CREATE TRIGGER trigger_distributors_updated_at BEFORE UPDATE ON public.distributors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_purchases_updated_at ON public.purchases;
CREATE TRIGGER trigger_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_purchase_items_updated_at ON public.purchase_items;
CREATE TRIGGER trigger_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_customer_transactions_updated_at ON public.customer_transactions;
CREATE TRIGGER trigger_customer_transactions_updated_at BEFORE UPDATE ON public.customer_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_expenses_updated_at ON public.expenses;
CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 6: ATOMIC POINTS & REWARD SECURITY DEFINER FUNCTIONS
-- ==============================================================================

-- Atomic Add Points Function
CREATE OR REPLACE FUNCTION add_associate_points(
    p_associate_id UUID,
    p_points INTEGER,
    p_bill_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    IF p_points <= 0 THEN
        RAISE EXCEPTION 'Points to add must be greater than zero';
    END IF;

    -- Lock associate row to prevent race conditions
    UPDATE public.associates
    SET current_points = current_points + p_points
    WHERE id = p_associate_id
    RETURNING current_points INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associate with id % does not exist', p_associate_id;
    END IF;

    -- Record transaction ledger
    INSERT INTO public.associate_p_trans (
        associate_id,
        points,
        calc,
        balance_points,
        bill_id,
        description
    ) VALUES (
        p_associate_id,
        p_points,
        'add',
        v_new_balance,
        p_bill_id,
        p_description
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic Deduct Points Function
CREATE OR REPLACE FUNCTION deduct_associate_points(
    p_associate_id UUID,
    p_points INTEGER,
    p_description TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_current_points INTEGER;
    v_new_balance INTEGER;
BEGIN
    IF p_points <= 0 THEN
        RAISE EXCEPTION 'Points to deduct must be greater than zero';
    END IF;

    -- Lock and inspect balance
    SELECT current_points INTO v_current_points
    FROM public.associates
    WHERE id = p_associate_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associate with id % does not exist', p_associate_id;
    END IF;

    IF v_current_points < p_points THEN
        RAISE EXCEPTION 'Insufficient points: current % < requested %', v_current_points, p_points;
    END IF;

    v_new_balance := v_current_points - p_points;

    UPDATE public.associates
    SET current_points = v_new_balance
    WHERE id = p_associate_id;

    -- Record transaction ledger
    INSERT INTO public.associate_p_trans (
        associate_id,
        points,
        calc,
        balance_points,
        bill_id,
        description
    ) VALUES (
        p_associate_id,
        p_points,
        'subtract',
        v_new_balance,
        NULL,
        p_description
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic Reward Redemption Function
CREATE OR REPLACE FUNCTION redeem_reward(
    p_reward_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_reward_points INTEGER;
    v_reward_status reward_status;
    v_reward_name VARCHAR(150);
    v_current_points INTEGER;
    v_new_balance INTEGER;
    v_transaction_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Fetch reward details
    SELECT name, points, status INTO v_reward_name, v_reward_points, v_reward_status
    FROM public.rewards
    WHERE id = p_reward_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reward not found';
    END IF;

    IF v_reward_status != 'active' THEN
        RAISE EXCEPTION 'Reward is currently inactive';
    END IF;

    -- Lock associate record
    SELECT current_points INTO v_current_points
    FROM public.associates
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associate profile not found';
    END IF;

    IF v_current_points < v_reward_points THEN
        RAISE EXCEPTION 'Insufficient points: current % < required %', v_current_points, v_reward_points;
    END IF;

    v_new_balance := v_current_points - v_reward_points;

    -- Deduct points
    UPDATE public.associates
    SET current_points = v_new_balance
    WHERE id = v_user_id;

    -- Record points ledger entry
    INSERT INTO public.associate_p_trans (
        associate_id,
        points,
        calc,
        balance_points,
        description
    ) VALUES (
        v_user_id,
        v_reward_points,
        'subtract',
        v_new_balance,
        'Reward Redemption: ' || v_reward_name
    );

    -- Record reward redemption transaction
    INSERT INTO public.reward_transactions (
        associate_id,
        reward_id,
        points,
        status
    ) VALUES (
        v_user_id,
        p_reward_id,
        v_reward_points,
        'pending'
    ) RETURNING id INTO v_transaction_id;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS) ACTIVATION
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associate_p_trans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PART 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
CREATE POLICY "profiles_user_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
CREATE POLICY "profiles_user_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 2. ASSOCIATES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "associates_admin_all" ON public.associates;
CREATE POLICY "associates_admin_all"
    ON public.associates
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "associates_select_own" ON public.associates;
CREATE POLICY "associates_select_own"
    ON public.associates
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- ------------------------------------------------------------------------------
-- 3. CUSTOMERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY "customers_admin_all"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customers_staff_select" ON public.customers;
CREATE POLICY "customers_staff_select"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "customers_staff_insert" ON public.customers;
CREATE POLICY "customers_staff_insert"
    ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

DROP POLICY IF EXISTS "customers_staff_update" ON public.customers;
CREATE POLICY "customers_staff_update"
    ON public.customers
    FOR UPDATE
    TO authenticated
    USING (is_associate() OR is_gst())
    WITH CHECK (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 4. REWARDS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rewards_admin_all" ON public.rewards;
CREATE POLICY "rewards_admin_all"
    ON public.rewards
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "rewards_authenticated_select" ON public.rewards;
CREATE POLICY "rewards_authenticated_select"
    ON public.rewards
    FOR SELECT
    TO authenticated
    USING (status = 'active' OR is_admin());

-- ------------------------------------------------------------------------------
-- 5. REWARD_TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reward_transactions_admin_all" ON public.reward_transactions;
CREATE POLICY "reward_transactions_admin_all"
    ON public.reward_transactions
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "reward_transactions_associate_select" ON public.reward_transactions;
CREATE POLICY "reward_transactions_associate_select"
    ON public.reward_transactions
    FOR SELECT
    TO authenticated
    USING (associate_id = auth.uid());

DROP POLICY IF EXISTS "reward_transactions_associate_insert" ON public.reward_transactions;
CREATE POLICY "reward_transactions_associate_insert"
    ON public.reward_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (associate_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all"
    ON public.categories
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "categories_authenticated_select" ON public.categories;
CREATE POLICY "categories_authenticated_select"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (status = 'active' OR is_admin());

-- ------------------------------------------------------------------------------
-- 7. PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
    ON public.products
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_authenticated_select" ON public.products;
CREATE POLICY "products_authenticated_select"
    ON public.products
    FOR SELECT
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 8. BILLS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "bills_admin_all" ON public.bills;
CREATE POLICY "bills_admin_all"
    ON public.bills
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "bills_staff_select" ON public.bills;
CREATE POLICY "bills_staff_select"
    ON public.bills
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "bills_staff_insert" ON public.bills;
CREATE POLICY "bills_staff_insert"
    ON public.bills
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

DROP POLICY IF EXISTS "bills_staff_update" ON public.bills;
CREATE POLICY "bills_staff_update"
    ON public.bills
    FOR UPDATE
    TO authenticated
    USING (is_associate() OR is_gst())
    WITH CHECK (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 9. ASSOCIATE_P_TRANS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "associate_p_trans_admin_all" ON public.associate_p_trans;
CREATE POLICY "associate_p_trans_admin_all"
    ON public.associate_p_trans
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "associate_p_trans_select_own" ON public.associate_p_trans;
CREATE POLICY "associate_p_trans_select_own"
    ON public.associate_p_trans
    FOR SELECT
    TO authenticated
    USING (associate_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. BILL_ITEMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "bill_items_admin_all" ON public.bill_items;
CREATE POLICY "bill_items_admin_all"
    ON public.bill_items
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "bill_items_staff_select" ON public.bill_items;
CREATE POLICY "bill_items_staff_select"
    ON public.bill_items
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "bill_items_staff_insert" ON public.bill_items;
CREATE POLICY "bill_items_staff_insert"
    ON public.bill_items
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 11. PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
CREATE POLICY "payments_admin_all"
    ON public.payments
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "payments_staff_select" ON public.payments;
CREATE POLICY "payments_staff_select"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "payments_staff_insert" ON public.payments;
CREATE POLICY "payments_staff_insert"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 12. DISTRIBUTORS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "distributors_admin_all" ON public.distributors;
CREATE POLICY "distributors_admin_all"
    ON public.distributors
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "distributors_authenticated_select" ON public.distributors;
CREATE POLICY "distributors_authenticated_select"
    ON public.distributors
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 13. PURCHASES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "purchases_admin_all" ON public.purchases;
CREATE POLICY "purchases_admin_all"
    ON public.purchases
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "purchases_staff_select" ON public.purchases;
CREATE POLICY "purchases_staff_select"
    ON public.purchases
    FOR SELECT
    TO authenticated
    USING (is_gst());

-- ------------------------------------------------------------------------------
-- 14. PURCHASE_ITEMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "purchase_items_admin_all" ON public.purchase_items;
CREATE POLICY "purchase_items_admin_all"
    ON public.purchase_items
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "purchase_items_staff_select" ON public.purchase_items;
CREATE POLICY "purchase_items_staff_select"
    ON public.purchase_items
    FOR SELECT
    TO authenticated
    USING (is_gst());

-- ------------------------------------------------------------------------------
-- 15. CUSTOMER_TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "customer_transactions_admin_all" ON public.customer_transactions;
CREATE POLICY "customer_transactions_admin_all"
    ON public.customer_transactions
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "customer_transactions_staff_select" ON public.customer_transactions;
CREATE POLICY "customer_transactions_staff_select"
    ON public.customer_transactions
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "customer_transactions_staff_insert" ON public.customer_transactions;
CREATE POLICY "customer_transactions_staff_insert"
    ON public.customer_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

DROP POLICY IF EXISTS "customer_transactions_staff_update" ON public.customer_transactions;
CREATE POLICY "customer_transactions_staff_update"
    ON public.customer_transactions
    FOR UPDATE
    TO authenticated
    USING (is_associate() OR is_gst())
    WITH CHECK (is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 16. EXPENSES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "expenses_admin_all" ON public.expenses;
CREATE POLICY "expenses_admin_all"
    ON public.expenses
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "expenses_staff_select" ON public.expenses;
CREATE POLICY "expenses_staff_select"
    ON public.expenses
    FOR SELECT
    TO authenticated
    USING (is_associate() OR is_gst());

DROP POLICY IF EXISTS "expenses_staff_insert" ON public.expenses;
CREATE POLICY "expenses_staff_insert"
    ON public.expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (is_associate() OR is_gst());

DROP POLICY IF EXISTS "expenses_staff_update" ON public.expenses;
CREATE POLICY "expenses_staff_update"
    ON public.expenses
    FOR UPDATE
    TO authenticated
    USING (is_admin() OR is_associate() OR is_gst())
    WITH CHECK (is_admin() OR is_associate() OR is_gst());

-- ------------------------------------------------------------------------------
-- 16. STORAGE POLICIES (rewards_media bucket)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can upload reward media" ON storage.objects;
CREATE POLICY "Admins can upload reward media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Associates can view reward media" ON storage.objects;
CREATE POLICY "Associates can view reward media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'associate'
  )
);

DROP POLICY IF EXISTS "Admins can view reward media" ON storage.objects;
CREATE POLICY "Admins can view reward media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update reward media" ON storage.objects;
CREATE POLICY "Admins can update reward media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete reward media" ON storage.objects;
CREATE POLICY "Admins can delete reward media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'rewards_media'
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

-- ==============================================================================
-- PART 9: SCHEMA VERIFICATION QUERIES (RUN TO AUDIT SETUP IN SUPABASE SQL EDITOR)
-- ==============================================================================
/*
-- 1. Check all 14 application tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'associates', 'customers', 'rewards',
    'reward_transactions', 'categories', 'products', 'bills',
    'associate_p_trans', 'bill_items', 'payments', 'distributors',
    'purchases', 'purchase_items'
  )
ORDER BY table_name;

-- 2. Verify Row Level Security is active on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verify Foreign Keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Verify RLS Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/
