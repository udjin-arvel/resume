--
-- PostgreSQL database dump
--

-- Dumped from database version 14.13
-- Dumped by pg_dump version 14.13

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
-- Name: order_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status_enum AS ENUM (
    'pending',
    'paid',
    'failed'
);


ALTER TYPE public.order_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: metric; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metric (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    name character varying NOT NULL,
    data jsonb
);


ALTER TABLE public.metric OWNER TO postgres;

--
-- Name: metric_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.metric_id_seq OWNER TO postgres;

--
-- Name: metric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metric_id_seq OWNED BY public.metric.id;


--
-- Name: order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."order" (
    "attemptsDelta" integer NOT NULL,
    "userId" integer NOT NULL,
    id integer NOT NULL,
    status public.order_status_enum DEFAULT 'pending'::public.order_status_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "stripeCustomerId" character varying(64),
    "priceId" character varying(64) NOT NULL,
    "stripeSessionId" character varying(256),
    "stripePaymentIntentId" character varying(256)
);


ALTER TABLE public."order" OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_seq OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying NOT NULL,
    "firstName" character varying,
    "lastName" character varying,
    "googleId" character varying,
    "attemptsLeft" integer,
    "attemptsCount" integer,
    "stripeCustomerId" character varying
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: metric id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric ALTER COLUMN id SET DEFAULT nextval('public.metric_id_seq'::regclass);


--
-- Name: order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: metric; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metric (id, "timestamp", name, data) FROM stdin;
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."order" ("attemptsDelta", "userId", id, status, "createdAt", "updatedAt", "stripeCustomerId", "priceId", "stripeSessionId", "stripePaymentIntentId") FROM stdin;
1	6	84	pending	2025-05-11 14:44:43.915338	2025-05-11 14:44:44.471541	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1IxbfspJGcGcs3I2qUtmsXDMhRGloP9Qk4S7NPbmek1t8MJkeQ49Szjqy	\N
1	6	85	paid	2025-05-11 14:45:59.703699	2025-05-11 14:47:02.643108	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1h7EDmfaxIYZGdLsRU8VtiK9PqhHzvFTovXVmtKvDcQytPFQPy3sEchCU	null
1	6	86	pending	2025-05-11 14:48:56.886574	2025-05-11 14:48:58.148481	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1APEP146FAZYdRHbYYCblnTx0OdUBFKIeGIr7IBjTTcu7ugcX2ZtHHrFk	\N
1	6	87	pending	2025-05-11 14:49:11.127801	2025-05-11 14:49:11.730425	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1R07s3sKCJN3pzMVfWNTYugK8cNFwlfZ0S5G2M9icJ7geLxm8spNKBQ8z	\N
1	6	88	pending	2025-05-11 14:49:21.816854	2025-05-11 14:49:22.40413	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1u9IiKy57ItUkbwhpzi56T8Q5NvBK2HQOLpJmaNpFSB4y0hZlPUcAxkR5	\N
1	6	89	paid	2025-05-11 14:49:39.502679	2025-05-11 14:50:15.795478	cus_SI8aL5JE5h5Vqx	price_demo	cs_test_a1zmqqinXVWvAgEP4s3HV6KJTPJMUaPhnJYdpzPW7yuRqWU4n4ce87Glqp	null
1	2	90	paid	2025-05-11 14:54:33.476663	2025-05-11 14:55:07.029808	cus_SHl9LGkyMcf3Pa	price_demo	cs_test_a1ddFoV5V1avZ7tO0IJNXEOnPhpFWHehsWoVTQwH548WawOki6m1QevBPi	null
1	7	91	pending	2025-05-11 15:14:23.168185	2025-05-11 15:14:23.650213	cus_SI94id93KV7JAt	price_demo	cs_test_a18g8n5Jz9LfX9nTiapoBq6Fpom4SOoQrNmF3Y7HHNVCGQW2q823VGvLds	\N
1	7	92	pending	2025-05-11 15:20:43.068757	2025-05-11 15:20:43.734484	cus_SI94id93KV7JAt	price_demo	cs_test_a1dr54WAMSlGOmMunalfbFbvnLitlj2js0xkH8lpVVQarpCGbzcchDLFSq	\N
1	7	93	paid	2025-05-11 15:24:57.933158	2025-05-11 15:25:26.64742	cus_SI94id93KV7JAt	price_demo	cs_test_a1qy1Q8bhznGe5Kj1gqO9jxrKGUubuJlPLi2DwHxHOn0TvE9oYl4r1Nnr2	null
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, email, "firstName", "lastName", "googleId", "attemptsLeft", "attemptsCount", "stripeCustomerId") FROM stdin;
2	user@example.com	Григорий	Юрьев	108425266717658629203	598	30	cus_SHl9LGkyMcf3Pa
3	user@example.com	Даша	Тюнь	112134926277916407452	90	\N	cus_SHnnlOz73Zg8FT
6	user@example.com	Aleksander	Surguchev	104387934588167377063	10	\N	cus_SI8aL5JE5h5Vqx
7	user@example.com	Елена	Юрьева	104822724639640823309	9	\N	cus_SI94id93KV7JAt
4	user@example.com	Максим	Самойленко	113275601425169527431	10	\N	cus_SHkyFKxaum64EU
\.


--
-- Name: metric_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metric_id_seq', 1, false);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_id_seq', 93, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 7, true);


--
-- Name: order PK_1031171c13130102495201e3e20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY (id);


--
-- Name: metric PK_7d24c075ea2926dd32bd1c534ce; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metric
    ADD CONSTRAINT "PK_7d24c075ea2926dd32bd1c534ce" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: order FK_caabe91507b3379c7ba73637b84; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--

