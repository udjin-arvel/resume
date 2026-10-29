--
-- PostgreSQL database dump
--

\restrict QHPubLJE3UYq5gUllFG8IMeRLXgXg9goxEzTSziOGCymtT0otPqNeWJHkPZrM0M

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: generations_design_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.generations_design_enum AS ENUM (
    'classic',
    'modern',
    'minimalist'
);


ALTER TYPE public.generations_design_enum OWNER TO postgres;

--
-- Name: generations_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.generations_status_enum AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE public.generations_status_enum OWNER TO postgres;

--
-- Name: generations_tone_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.generations_tone_enum AS ENUM (
    'formal',
    'friendly',
    'strict'
);


ALTER TYPE public.generations_tone_enum OWNER TO postgres;

--
-- Name: generations_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.generations_type_enum AS ENUM (
    'resume',
    'cover_letter'
);


ALTER TYPE public.generations_type_enum OWNER TO postgres;

--
-- Name: orders_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orders_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public.orders_status_enum OWNER TO postgres;

--
-- Name: orders_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orders_type_enum AS ENUM (
    'subscription',
    'addon'
);


ALTER TYPE public.orders_type_enum OWNER TO postgres;

--
-- Name: users_plan_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_plan_enum AS ENUM (
    'free',
    'pro',
    'pro_plus'
);


ALTER TYPE public.users_plan_enum OWNER TO postgres;

--
-- Name: users_subscriptionstatus_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_subscriptionstatus_enum AS ENUM (
    'active',
    'canceling',
    'canceled'
);


ALTER TYPE public.users_subscriptionstatus_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: generations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type public.generations_type_enum NOT NULL,
    status public.generations_status_enum DEFAULT 'pending'::public.generations_status_enum NOT NULL,
    "jobDescription" text NOT NULL,
    "jobUrl" character varying,
    "userExperience" text,
    "existingResume" text,
    tone public.generations_tone_enum,
    design public.generations_design_enum,
    "generatedContent" text,
    metadata json,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.generations OWNER TO postgres;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "stripePaymentIntentId" character varying NOT NULL,
    "stripeSessionId" character varying NOT NULL,
    "userId" uuid NOT NULL,
    type public.orders_type_enum NOT NULL,
    status public.orders_status_enum DEFAULT 'pending'::public.orders_status_enum NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying NOT NULL,
    plan character varying,
    "addonType" character varying,
    "addonQuantity" integer,
    metadata json,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    avatar character varying,
    "googleId" character varying,
    plan public.users_plan_enum DEFAULT 'free'::public.users_plan_enum NOT NULL,
    "remainingGenerations" integer DEFAULT 3 NOT NULL,
    "totalGenerations" integer DEFAULT 3 NOT NULL,
    "stripeCustomerId" character varying,
    "stripeSubscriptionId" character varying,
    "subscriptionExpiresAt" timestamp without time zone,
    "subscriptionStatus" public.users_subscriptionstatus_enum DEFAULT 'active'::public.users_subscriptionstatus_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: generations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.generations (id, "userId", type, status, "jobDescription", "jobUrl", "userExperience", "existingResume", tone, design, "generatedContent", metadata, "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, "stripePaymentIntentId", "stripeSessionId", "userId", type, status, amount, currency, plan, "addonType", "addonQuantity", metadata, "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, avatar, "googleId", plan, "remainingGenerations", "totalGenerations", "stripeCustomerId", "stripeSubscriptionId", "subscriptionExpiresAt", "subscriptionStatus", "createdAt", "updatedAt") FROM stdin;
03ea3e50-56e1-436d-af83-146439c60a1b	user@example.com	Иван Иванов	https://example.com/avatar.png	000	free	4	3	\N	\N	\N	active	2025-09-16 11:55:59.67689	2025-09-23 14:00:41.791677
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: generations PK_9d2a52fbde1fba42c24ec42ddd2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT "PK_9d2a52fbde1fba42c24ec42ddd2" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: IDX_178e0a88de0a59d8afc1d093db; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_178e0a88de0a59d8afc1d093db" ON public.orders USING btree ("stripeSessionId");


--
-- Name: IDX_5d0d9997b74ffe21230d302629; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_5d0d9997b74ffe21230d302629" ON public.orders USING btree ("stripePaymentIntentId");


--
-- Name: IDX_97672ac88f789774dd47f7c8be; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email);


--
-- Name: orders FK_151b79a83ba240b0cb31b2302d1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: generations FK_c2a1ec14c609ee042edbbbc0a81; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generations
    ADD CONSTRAINT "FK_c2a1ec14c609ee042edbbbc0a81" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict QHPubLJE3UYq5gUllFG8IMeRLXgXg9goxEzTSziOGCymtT0otPqNeWJHkPZrM0M

