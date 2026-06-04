--
-- PostgreSQL database dump
--

\restrict NvrriSPNtKlLWAM0hAPY0qzpH5TX3Q7HhWhS4htl02PHze8hWR0Uh1htEX7LZPY

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-04 20:02:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 267 (class 1259 OID 132676)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    address_id integer NOT NULL,
    address character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    state_id integer,
    country_id integer,
    zip_code character varying(20),
    active_status boolean
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 132675)
-- Name: addresses_address_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_address_id_seq OWNER TO postgres;

--
-- TOC entry 5449 (class 0 OID 0)
-- Dependencies: 266
-- Name: addresses_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_address_id_seq OWNED BY public.addresses.address_id;


--
-- TOC entry 249 (class 1259 OID 132395)
-- Name: amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenities (
    amenity_id integer NOT NULL,
    community_id integer NOT NULL,
    amenity_type_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    location character varying(255),
    capacity integer,
    fee_enabled boolean,
    booking_fee double precision,
    slot1_start character varying(10),
    slot1_end character varying(10),
    slot2_start character varying(10),
    slot2_end character varying(10),
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.amenities OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 132394)
-- Name: amenities_amenity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenities_amenity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenities_amenity_id_seq OWNER TO postgres;

--
-- TOC entry 5450 (class 0 OID 0)
-- Dependencies: 248
-- Name: amenities_amenity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenities_amenity_id_seq OWNED BY public.amenities.amenity_id;


--
-- TOC entry 273 (class 1259 OID 132792)
-- Name: amenity_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenity_bookings (
    booking_id integer NOT NULL,
    amenity_id integer NOT NULL,
    community_id integer NOT NULL,
    booked_by_id integer NOT NULL,
    booking_date date NOT NULL,
    slot_number integer NOT NULL,
    slot_start character varying(10) NOT NULL,
    slot_end character varying(10) NOT NULL,
    status character varying(30),
    fee_amount double precision,
    payment_id integer,
    is_paid boolean,
    payment_due_date date,
    cancelled_by_id integer,
    cancelled_date timestamp with time zone,
    cancel_reason text,
    is_refunded boolean,
    refund_date timestamp with time zone,
    refund_amount double precision,
    active_status boolean,
    created_date timestamp with time zone DEFAULT now(),
    modified_date timestamp with time zone
);


ALTER TABLE public.amenity_bookings OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 132791)
-- Name: amenity_bookings_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenity_bookings_booking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenity_bookings_booking_id_seq OWNER TO postgres;

--
-- TOC entry 5451 (class 0 OID 0)
-- Dependencies: 272
-- Name: amenity_bookings_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenity_bookings_booking_id_seq OWNED BY public.amenity_bookings.booking_id;


--
-- TOC entry 232 (class 1259 OID 132207)
-- Name: amenity_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenity_types (
    amenity_type_id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    description text,
    active_status boolean,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.amenity_types OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 132206)
-- Name: amenity_types_amenity_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenity_types_amenity_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.amenity_types_amenity_type_id_seq OWNER TO postgres;

--
-- TOC entry 5452 (class 0 OID 0)
-- Dependencies: 231
-- Name: amenity_types_amenity_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenity_types_amenity_type_id_seq OWNED BY public.amenity_types.amenity_type_id;


--
-- TOC entry 245 (class 1259 OID 132357)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    audit_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    community_id integer,
    ip_address character varying(50),
    user_agent character varying(255),
    old_value text,
    new_value text,
    request_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 132356)
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_audit_id_seq OWNER TO postgres;

--
-- TOC entry 5453 (class 0 OID 0)
-- Dependencies: 244
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_audit_id_seq OWNED BY public.audit_logs.audit_id;


--
-- TOC entry 226 (class 1259 OID 132167)
-- Name: communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communities (
    community_id integer NOT NULL,
    name character varying(255) NOT NULL,
    community_code character varying(50) NOT NULL,
    address_id integer,
    president_email_id character varying(255),
    president_invite_status character varying(20),
    president_user_id integer,
    secretary_email_id character varying(255),
    secretary_invite_status character varying(20),
    secretary_user_id integer,
    treasurer_email_id character varying(255),
    treasurer_invite_status character varying(20),
    treasurer_user_id integer,
    admin_email_id character varying(255),
    admin_invite_status character varying(20),
    admin_user_id integer,
    plan_id integer,
    plan_expire_date date,
    license_status character varying(20),
    community_size integer,
    total_owners integer,
    contact_person character varying(255),
    time_zone character varying(50),
    amenity_fee_enabled boolean,
    violation_fee_enabled boolean,
    late_fee_enabled boolean,
    late_fee_days integer,
    late_fee_amount double precision,
    bank_name character varying(255),
    bank_account_no character varying(255),
    bank_routing_no character varying(255),
    bank_account_name character varying(255),
    contract_id integer,
    visible_tabs text,
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.communities OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 132166)
-- Name: communities_community_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communities_community_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.communities_community_id_seq OWNER TO postgres;

--
-- TOC entry 5454 (class 0 OID 0)
-- Dependencies: 225
-- Name: communities_community_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communities_community_id_seq OWNED BY public.communities.community_id;


--
-- TOC entry 239 (class 1259 OID 132272)
-- Name: community_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_documents (
    document_id integer NOT NULL,
    community_id integer NOT NULL,
    document_name character varying(255) NOT NULL,
    document_type character varying(50) NOT NULL,
    document_url text NOT NULL,
    uploaded_by_id integer,
    active_status boolean,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.community_documents OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 132271)
-- Name: community_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.community_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_documents_document_id_seq OWNER TO postgres;

--
-- TOC entry 5455 (class 0 OID 0)
-- Dependencies: 238
-- Name: community_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.community_documents_document_id_seq OWNED BY public.community_documents.document_id;


--
-- TOC entry 241 (class 1259 OID 132298)
-- Name: community_join_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.community_join_requests (
    request_id integer NOT NULL,
    user_id integer NOT NULL,
    community_id integer NOT NULL,
    pass_code_entered character varying(50) NOT NULL,
    id_proof_url character varying,
    address_proof_url character varying,
    unit_no character varying(50),
    message text,
    status character varying(20),
    admin_note text,
    created_date timestamp with time zone DEFAULT now(),
    processed_date timestamp with time zone,
    processed_by integer
);


ALTER TABLE public.community_join_requests OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 132297)
-- Name: community_join_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.community_join_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.community_join_requests_request_id_seq OWNER TO postgres;

--
-- TOC entry 5456 (class 0 OID 0)
-- Dependencies: 240
-- Name: community_join_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.community_join_requests_request_id_seq OWNED BY public.community_join_requests.request_id;


--
-- TOC entry 257 (class 1259 OID 132525)
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    contract_id integer NOT NULL,
    contract_code character varying(50) NOT NULL,
    sales_agent_id integer,
    sales_agent_name character varying(255),
    status character varying(20),
    client_first_name character varying(100),
    client_middle_name character varying(100),
    client_last_name character varying(100),
    client_address character varying(255),
    client_city character varying(100),
    client_zip_code character varying(20),
    client_country character varying(100),
    client_phone_number character varying(20),
    client_email_address character varying(255),
    business_name character varying(255),
    business_address character varying(255),
    business_phone_number character varying(20),
    client_preferred_communication_channel character varying(50),
    plan_selected character varying(100),
    annual_renewal_fee numeric(10,2),
    one_time_set_up numeric(10,2),
    size_of_the_community integer,
    renewal_cycle character varying(50),
    payment_method_details character varying(255),
    onboarded_community_id integer,
    onboarded_user_id integer,
    created_date timestamp with time zone DEFAULT now(),
    created_by_id integer,
    last_updated timestamp with time zone DEFAULT now(),
    last_updated_by_id integer
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 132524)
-- Name: contracts_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contracts_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_contract_id_seq OWNER TO postgres;

--
-- TOC entry 5457 (class 0 OID 0)
-- Dependencies: 256
-- Name: contracts_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contracts_contract_id_seq OWNED BY public.contracts.contract_id;


--
-- TOC entry 224 (class 1259 OID 132155)
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    country_id integer NOT NULL,
    country_name character varying(100) NOT NULL,
    country_code character varying(10),
    active_status boolean
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 132154)
-- Name: countries_country_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.countries_country_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.countries_country_id_seq OWNER TO postgres;

--
-- TOC entry 5458 (class 0 OID 0)
-- Dependencies: 223
-- Name: countries_country_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.countries_country_id_seq OWNED BY public.countries.country_id;


--
-- TOC entry 253 (class 1259 OID 132460)
-- Name: faqs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faqs (
    faq_id integer NOT NULL,
    community_id integer NOT NULL,
    question character varying(500) NOT NULL,
    answer text NOT NULL,
    doc_url text,
    order_index integer,
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.faqs OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 132459)
-- Name: faqs_faq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faqs_faq_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faqs_faq_id_seq OWNER TO postgres;

--
-- TOC entry 5459 (class 0 OID 0)
-- Dependencies: 252
-- Name: faqs_faq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faqs_faq_id_seq OWNED BY public.faqs.faq_id;


--
-- TOC entry 277 (class 1259 OID 132862)
-- Name: meeting_rsvps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meeting_rsvps (
    rsvp_id integer NOT NULL,
    meeting_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.meeting_rsvps OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 132861)
-- Name: meeting_rsvps_rsvp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meeting_rsvps_rsvp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meeting_rsvps_rsvp_id_seq OWNER TO postgres;

--
-- TOC entry 5460 (class 0 OID 0)
-- Dependencies: 276
-- Name: meeting_rsvps_rsvp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meeting_rsvps_rsvp_id_seq OWNED BY public.meeting_rsvps.rsvp_id;


--
-- TOC entry 263 (class 1259 OID 132614)
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings (
    meeting_id integer NOT NULL,
    community_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    meeting_date timestamp with time zone NOT NULL,
    location character varying(255),
    meeting_link character varying(500),
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.meetings OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 132613)
-- Name: meetings_meeting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meetings_meeting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meetings_meeting_id_seq OWNER TO postgres;

--
-- TOC entry 5461 (class 0 OID 0)
-- Dependencies: 262
-- Name: meetings_meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meetings_meeting_id_seq OWNED BY public.meetings.meeting_id;


--
-- TOC entry 251 (class 1259 OID 132430)
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    news_id integer NOT NULL,
    community_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(50),
    is_pinned boolean,
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.news OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 132429)
-- Name: news_news_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_news_id_seq OWNER TO postgres;

--
-- TOC entry 5462 (class 0 OID 0)
-- Dependencies: 250
-- Name: news_news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_news_id_seq OWNED BY public.news.news_id;


--
-- TOC entry 234 (class 1259 OID 132220)
-- Name: otp_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_tokens (
    otp_id integer NOT NULL,
    user_id integer NOT NULL,
    otp_code character varying(6) NOT NULL,
    otp_type character varying(30) NOT NULL,
    is_used boolean,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.otp_tokens OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 132219)
-- Name: otp_tokens_otp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.otp_tokens_otp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.otp_tokens_otp_id_seq OWNER TO postgres;

--
-- TOC entry 5463 (class 0 OID 0)
-- Dependencies: 233
-- Name: otp_tokens_otp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.otp_tokens_otp_id_seq OWNED BY public.otp_tokens.otp_id;


--
-- TOC entry 259 (class 1259 OID 132565)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    community_id integer,
    user_id integer,
    amount double precision NOT NULL,
    reason character varying(255) NOT NULL,
    payment_date timestamp with time zone DEFAULT now(),
    payment_due_date date,
    reference_id integer,
    payment_method character varying(50),
    gateway_token character varying(255),
    payer_bank_name character varying(255),
    payer_account_no character varying(255),
    escrow_flag boolean,
    recurring_flag boolean,
    recurring_interval character varying(50),
    status character varying(50),
    active_status boolean
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 132564)
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5464 (class 0 OID 0)
-- Dependencies: 258
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- TOC entry 261 (class 1259 OID 132589)
-- Name: recurring_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_payments (
    recurring_id integer NOT NULL,
    community_id integer NOT NULL,
    user_id integer NOT NULL,
    amount double precision NOT NULL,
    "interval" character varying(50),
    payment_method character varying(50),
    gateway_token character varying(255),
    payer_bank_name character varying(255),
    payer_account_no character varying(255),
    active_status boolean,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recurring_payments OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 132588)
-- Name: recurring_payments_recurring_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_payments_recurring_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recurring_payments_recurring_id_seq OWNER TO postgres;

--
-- TOC entry 5465 (class 0 OID 0)
-- Dependencies: 260
-- Name: recurring_payments_recurring_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_payments_recurring_id_seq OWNED BY public.recurring_payments.recurring_id;


--
-- TOC entry 220 (class 1259 OID 132122)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description character varying(255),
    active_status boolean,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 132121)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5466 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 283 (class 1259 OID 132930)
-- Name: service_request_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_request_notes (
    note_id integer NOT NULL,
    request_id integer NOT NULL,
    note text NOT NULL,
    added_by_id integer NOT NULL,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.service_request_notes OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 132929)
-- Name: service_request_notes_note_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_request_notes_note_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_request_notes_note_id_seq OWNER TO postgres;

--
-- TOC entry 5467 (class 0 OID 0)
-- Dependencies: 282
-- Name: service_request_notes_note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_request_notes_note_id_seq OWNED BY public.service_request_notes.note_id;


--
-- TOC entry 230 (class 1259 OID 132195)
-- Name: service_request_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_request_statuses (
    status_id integer NOT NULL,
    status_name character varying(50) NOT NULL
);


ALTER TABLE public.service_request_statuses OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 132194)
-- Name: service_request_statuses_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_request_statuses_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_request_statuses_status_id_seq OWNER TO postgres;

--
-- TOC entry 5468 (class 0 OID 0)
-- Dependencies: 229
-- Name: service_request_statuses_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_request_statuses_status_id_seq OWNED BY public.service_request_statuses.status_id;


--
-- TOC entry 247 (class 1259 OID 132376)
-- Name: service_request_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_request_types (
    type_id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    description text,
    community_id integer NOT NULL,
    active_status boolean,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.service_request_types OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 132375)
-- Name: service_request_types_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_request_types_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_request_types_type_id_seq OWNER TO postgres;

--
-- TOC entry 5469 (class 0 OID 0)
-- Dependencies: 246
-- Name: service_request_types_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_request_types_type_id_seq OWNED BY public.service_request_types.type_id;


--
-- TOC entry 271 (class 1259 OID 132749)
-- Name: service_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_requests (
    request_id integer NOT NULL,
    community_id integer NOT NULL,
    type_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    submitted_by_id integer NOT NULL,
    status_id integer NOT NULL,
    vendor_id integer,
    payment_id integer,
    priority character varying(20),
    active_status boolean,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone,
    closed_date timestamp with time zone
);


ALTER TABLE public.service_requests OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 132748)
-- Name: service_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_requests_request_id_seq OWNER TO postgres;

--
-- TOC entry 5470 (class 0 OID 0)
-- Dependencies: 270
-- Name: service_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_requests_request_id_seq OWNED BY public.service_requests.request_id;


--
-- TOC entry 237 (class 1259 OID 132256)
-- Name: states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.states (
    state_id integer NOT NULL,
    state_name character varying(100) NOT NULL,
    state_code character varying(10),
    country_id integer NOT NULL,
    active_status boolean
);


ALTER TABLE public.states OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 132255)
-- Name: states_state_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.states_state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.states_state_id_seq OWNER TO postgres;

--
-- TOC entry 5471 (class 0 OID 0)
-- Dependencies: 236
-- Name: states_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.states_state_id_seq OWNED BY public.states.state_id;


--
-- TOC entry 279 (class 1259 OID 132884)
-- Name: survey_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_options (
    option_id integer NOT NULL,
    survey_id integer NOT NULL,
    option_text character varying(255) NOT NULL
);


ALTER TABLE public.survey_options OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 132883)
-- Name: survey_options_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_options_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_options_option_id_seq OWNER TO postgres;

--
-- TOC entry 5472 (class 0 OID 0)
-- Dependencies: 278
-- Name: survey_options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_options_option_id_seq OWNED BY public.survey_options.option_id;


--
-- TOC entry 287 (class 1259 OID 132988)
-- Name: survey_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_votes (
    vote_id integer NOT NULL,
    survey_id integer NOT NULL,
    option_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.survey_votes OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 132987)
-- Name: survey_votes_vote_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_votes_vote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_votes_vote_id_seq OWNER TO postgres;

--
-- TOC entry 5473 (class 0 OID 0)
-- Dependencies: 286
-- Name: survey_votes_vote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_votes_vote_id_seq OWNED BY public.survey_votes.vote_id;


--
-- TOC entry 265 (class 1259 OID 132645)
-- Name: surveys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.surveys (
    survey_id integer NOT NULL,
    community_id integer NOT NULL,
    title character varying(255) NOT NULL,
    question text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.surveys OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 132644)
-- Name: surveys_survey_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.surveys_survey_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.surveys_survey_id_seq OWNER TO postgres;

--
-- TOC entry 5474 (class 0 OID 0)
-- Dependencies: 264
-- Name: surveys_survey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.surveys_survey_id_seq OWNED BY public.surveys.survey_id;


--
-- TOC entry 235 (class 1259 OID 132238)
-- Name: user_communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_communities (
    user_id integer NOT NULL,
    community_id integer NOT NULL,
    unit_no character varying(50),
    unit_no_2 character varying(50)
);


ALTER TABLE public.user_communities OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 132135)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    community_id integer,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    mobile_number character varying(20),
    mobile_is_verified boolean,
    email_id character varying(255) NOT NULL,
    email_id_is_verified boolean,
    password character varying(255) NOT NULL,
    login_attempts integer,
    account_locked_until timestamp with time zone,
    last_failed_login timestamp with time zone,
    account_status character varying(30),
    time_zone character varying(50),
    role_id integer NOT NULL,
    is_client boolean,
    unit_no character varying(50),
    unit_no_2 character varying(50),
    active_status boolean,
    user_profile_url text,
    id_proof_url text,
    address_proof_url text,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone,
    last_login timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 132134)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5475 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 285 (class 1259 OID 132955)
-- Name: vendor_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_assignments (
    assignment_id integer NOT NULL,
    vendor_id integer NOT NULL,
    request_id integer NOT NULL,
    community_id integer NOT NULL,
    quote_amount double precision,
    quote_date date,
    service_location character varying(255),
    vendor_receipt_no character varying(100),
    status character varying(20),
    assigned_by_id integer,
    assigned_date timestamp with time zone DEFAULT now(),
    completed_date timestamp with time zone
);


ALTER TABLE public.vendor_assignments OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 132954)
-- Name: vendor_assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_assignments_assignment_id_seq OWNER TO postgres;

--
-- TOC entry 5476 (class 0 OID 0)
-- Dependencies: 284
-- Name: vendor_assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_assignments_assignment_id_seq OWNED BY public.vendor_assignments.assignment_id;


--
-- TOC entry 275 (class 1259 OID 132831)
-- Name: vendor_feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendor_feedbacks (
    feedback_id integer NOT NULL,
    vendor_id integer NOT NULL,
    community_id integer NOT NULL,
    user_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.vendor_feedbacks OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 132830)
-- Name: vendor_feedbacks_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendor_feedbacks_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendor_feedbacks_feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 274
-- Name: vendor_feedbacks_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendor_feedbacks_feedback_id_seq OWNED BY public.vendor_feedbacks.feedback_id;


--
-- TOC entry 255 (class 1259 OID 132490)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    vendor_id integer NOT NULL,
    community_id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    contact_person character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    zip_code character varying(20),
    category character varying(100) NOT NULL,
    license_number character varying(100),
    license_expiry date,
    insurance_number character varying(100),
    insurance_expiry date,
    license_doc_url text,
    insurance_doc_url text,
    vendor_access_code character varying(20),
    access_code_used boolean,
    access_code_expiry timestamp with time zone,
    contract_code character varying(20),
    active_status boolean,
    onboard_status character varying(20),
    added_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 132489)
-- Name: vendors_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_vendor_id_seq OWNER TO postgres;

--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 254
-- Name: vendors_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_vendor_id_seq OWNED BY public.vendors.vendor_id;


--
-- TOC entry 281 (class 1259 OID 132900)
-- Name: violation_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violation_documents (
    violation_document_id integer NOT NULL,
    violation_id integer NOT NULL,
    community_id integer NOT NULL,
    doc_url text NOT NULL,
    description text,
    doc_type character varying(20),
    active_status boolean,
    created_by_id integer,
    created_by_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.violation_documents OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 132899)
-- Name: violation_documents_violation_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violation_documents_violation_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violation_documents_violation_document_id_seq OWNER TO postgres;

--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 280
-- Name: violation_documents_violation_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violation_documents_violation_document_id_seq OWNED BY public.violation_documents.violation_document_id;


--
-- TOC entry 228 (class 1259 OID 132183)
-- Name: violation_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violation_statuses (
    violation_status_id integer NOT NULL,
    violation_status character varying(100) NOT NULL
);


ALTER TABLE public.violation_statuses OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 132182)
-- Name: violation_statuses_violation_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violation_statuses_violation_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violation_statuses_violation_status_id_seq OWNER TO postgres;

--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 227
-- Name: violation_statuses_violation_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violation_statuses_violation_status_id_seq OWNED BY public.violation_statuses.violation_status_id;


--
-- TOC entry 243 (class 1259 OID 132328)
-- Name: violation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violation_types (
    violation_type_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    amount double precision,
    late_charge double precision,
    due_days integer,
    community_id integer NOT NULL,
    active_status boolean,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.violation_types OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 132327)
-- Name: violation_types_violation_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violation_types_violation_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violation_types_violation_type_id_seq OWNER TO postgres;

--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 242
-- Name: violation_types_violation_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violation_types_violation_type_id_seq OWNED BY public.violation_types.violation_type_id;


--
-- TOC entry 269 (class 1259 OID 132697)
-- Name: violations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violations (
    violation_id integer NOT NULL,
    violation_type_id integer NOT NULL,
    violation_date date NOT NULL,
    violation_due_date date,
    community_id integer NOT NULL,
    amount double precision,
    late_charge_applied double precision,
    client_id integer NOT NULL,
    violation_status_id integer NOT NULL,
    remarks text,
    active_status boolean,
    is_disputed boolean,
    dispute_description text,
    dispute_date timestamp with time zone,
    dispute_deadline date,
    dispute_resolved boolean,
    dispute_resolved_date timestamp with time zone,
    dispute_resolved_by integer,
    dispute_resolution text,
    created_by_id integer,
    created_date timestamp with time zone DEFAULT now(),
    modified_by_id integer,
    modified_date timestamp with time zone
);


ALTER TABLE public.violations OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 132696)
-- Name: violations_violation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violations_violation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violations_violation_id_seq OWNER TO postgres;

--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 268
-- Name: violations_violation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violations_violation_id_seq OWNED BY public.violations.violation_id;


--
-- TOC entry 5068 (class 2604 OID 132679)
-- Name: addresses address_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN address_id SET DEFAULT nextval('public.addresses_address_id_seq'::regclass);


--
-- TOC entry 5049 (class 2604 OID 132398)
-- Name: amenities amenity_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities ALTER COLUMN amenity_id SET DEFAULT nextval('public.amenities_amenity_id_seq'::regclass);


--
-- TOC entry 5073 (class 2604 OID 132795)
-- Name: amenity_bookings booking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings ALTER COLUMN booking_id SET DEFAULT nextval('public.amenity_bookings_booking_id_seq'::regclass);


--
-- TOC entry 5034 (class 2604 OID 132210)
-- Name: amenity_types amenity_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_types ALTER COLUMN amenity_type_id SET DEFAULT nextval('public.amenity_types_amenity_type_id_seq'::regclass);


--
-- TOC entry 5045 (class 2604 OID 132360)
-- Name: audit_logs audit_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN audit_id SET DEFAULT nextval('public.audit_logs_audit_id_seq'::regclass);


--
-- TOC entry 5030 (class 2604 OID 132170)
-- Name: communities community_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities ALTER COLUMN community_id SET DEFAULT nextval('public.communities_community_id_seq'::regclass);


--
-- TOC entry 5039 (class 2604 OID 132275)
-- Name: community_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_documents ALTER COLUMN document_id SET DEFAULT nextval('public.community_documents_document_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 132301)
-- Name: community_join_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests ALTER COLUMN request_id SET DEFAULT nextval('public.community_join_requests_request_id_seq'::regclass);


--
-- TOC entry 5057 (class 2604 OID 132528)
-- Name: contracts contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts ALTER COLUMN contract_id SET DEFAULT nextval('public.contracts_contract_id_seq'::regclass);


--
-- TOC entry 5029 (class 2604 OID 132158)
-- Name: countries country_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries ALTER COLUMN country_id SET DEFAULT nextval('public.countries_country_id_seq'::regclass);


--
-- TOC entry 5053 (class 2604 OID 132463)
-- Name: faqs faq_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs ALTER COLUMN faq_id SET DEFAULT nextval('public.faqs_faq_id_seq'::regclass);


--
-- TOC entry 5077 (class 2604 OID 132865)
-- Name: meeting_rsvps rsvp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_rsvps ALTER COLUMN rsvp_id SET DEFAULT nextval('public.meeting_rsvps_rsvp_id_seq'::regclass);


--
-- TOC entry 5064 (class 2604 OID 132617)
-- Name: meetings meeting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings ALTER COLUMN meeting_id SET DEFAULT nextval('public.meetings_meeting_id_seq'::regclass);


--
-- TOC entry 5051 (class 2604 OID 132433)
-- Name: news news_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news ALTER COLUMN news_id SET DEFAULT nextval('public.news_news_id_seq'::regclass);


--
-- TOC entry 5036 (class 2604 OID 132223)
-- Name: otp_tokens otp_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_tokens ALTER COLUMN otp_id SET DEFAULT nextval('public.otp_tokens_otp_id_seq'::regclass);


--
-- TOC entry 5060 (class 2604 OID 132568)
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- TOC entry 5062 (class 2604 OID 132592)
-- Name: recurring_payments recurring_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_payments ALTER COLUMN recurring_id SET DEFAULT nextval('public.recurring_payments_recurring_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 132125)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 5082 (class 2604 OID 132933)
-- Name: service_request_notes note_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_notes ALTER COLUMN note_id SET DEFAULT nextval('public.service_request_notes_note_id_seq'::regclass);


--
-- TOC entry 5033 (class 2604 OID 132198)
-- Name: service_request_statuses status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_statuses ALTER COLUMN status_id SET DEFAULT nextval('public.service_request_statuses_status_id_seq'::regclass);


--
-- TOC entry 5047 (class 2604 OID 132379)
-- Name: service_request_types type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_types ALTER COLUMN type_id SET DEFAULT nextval('public.service_request_types_type_id_seq'::regclass);


--
-- TOC entry 5071 (class 2604 OID 132752)
-- Name: service_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN request_id SET DEFAULT nextval('public.service_requests_request_id_seq'::regclass);


--
-- TOC entry 5038 (class 2604 OID 132259)
-- Name: states state_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states ALTER COLUMN state_id SET DEFAULT nextval('public.states_state_id_seq'::regclass);


--
-- TOC entry 5079 (class 2604 OID 132887)
-- Name: survey_options option_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_options ALTER COLUMN option_id SET DEFAULT nextval('public.survey_options_option_id_seq'::regclass);


--
-- TOC entry 5086 (class 2604 OID 132991)
-- Name: survey_votes vote_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_votes ALTER COLUMN vote_id SET DEFAULT nextval('public.survey_votes_vote_id_seq'::regclass);


--
-- TOC entry 5066 (class 2604 OID 132648)
-- Name: surveys survey_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys ALTER COLUMN survey_id SET DEFAULT nextval('public.surveys_survey_id_seq'::regclass);


--
-- TOC entry 5027 (class 2604 OID 132138)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5084 (class 2604 OID 132958)
-- Name: vendor_assignments assignment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.vendor_assignments_assignment_id_seq'::regclass);


--
-- TOC entry 5075 (class 2604 OID 132834)
-- Name: vendor_feedbacks feedback_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_feedbacks ALTER COLUMN feedback_id SET DEFAULT nextval('public.vendor_feedbacks_feedback_id_seq'::regclass);


--
-- TOC entry 5055 (class 2604 OID 132493)
-- Name: vendors vendor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN vendor_id SET DEFAULT nextval('public.vendors_vendor_id_seq'::regclass);


--
-- TOC entry 5080 (class 2604 OID 132903)
-- Name: violation_documents violation_document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_documents ALTER COLUMN violation_document_id SET DEFAULT nextval('public.violation_documents_violation_document_id_seq'::regclass);


--
-- TOC entry 5032 (class 2604 OID 132186)
-- Name: violation_statuses violation_status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_statuses ALTER COLUMN violation_status_id SET DEFAULT nextval('public.violation_statuses_violation_status_id_seq'::regclass);


--
-- TOC entry 5043 (class 2604 OID 132331)
-- Name: violation_types violation_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_types ALTER COLUMN violation_type_id SET DEFAULT nextval('public.violation_types_violation_type_id_seq'::regclass);


--
-- TOC entry 5069 (class 2604 OID 132700)
-- Name: violations violation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations ALTER COLUMN violation_id SET DEFAULT nextval('public.violations_violation_id_seq'::regclass);


--
-- TOC entry 5176 (class 2606 OID 132684)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);


--
-- TOC entry 5146 (class 2606 OID 132407)
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (amenity_id);


--
-- TOC entry 5185 (class 2606 OID 132808)
-- Name: amenity_bookings amenity_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings
    ADD CONSTRAINT amenity_bookings_pkey PRIMARY KEY (booking_id);


--
-- TOC entry 5120 (class 2606 OID 132217)
-- Name: amenity_types amenity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_types
    ADD CONSTRAINT amenity_types_pkey PRIMARY KEY (amenity_type_id);


--
-- TOC entry 5140 (class 2606 OID 132368)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id);


--
-- TOC entry 5105 (class 2606 OID 132180)
-- Name: communities communities_community_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_community_code_key UNIQUE (community_code);


--
-- TOC entry 5107 (class 2606 OID 132178)
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (community_id);


--
-- TOC entry 5131 (class 2606 OID 132285)
-- Name: community_documents community_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_documents
    ADD CONSTRAINT community_documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 5134 (class 2606 OID 132310)
-- Name: community_join_requests community_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 5160 (class 2606 OID 132536)
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (contract_id);


--
-- TOC entry 5100 (class 2606 OID 132164)
-- Name: countries countries_country_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_country_name_key UNIQUE (country_name);


--
-- TOC entry 5102 (class 2606 OID 132162)
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (country_id);


--
-- TOC entry 5152 (class 2606 OID 132472)
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (faq_id);


--
-- TOC entry 5193 (class 2606 OID 132871)
-- Name: meeting_rsvps meeting_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_pkey PRIMARY KEY (rsvp_id);


--
-- TOC entry 5171 (class 2606 OID 132627)
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (meeting_id);


--
-- TOC entry 5150 (class 2606 OID 132442)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (news_id);


--
-- TOC entry 5124 (class 2606 OID 132231)
-- Name: otp_tokens otp_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_tokens
    ADD CONSTRAINT otp_tokens_pkey PRIMARY KEY (otp_id);


--
-- TOC entry 5165 (class 2606 OID 132576)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 5168 (class 2606 OID 132601)
-- Name: recurring_payments recurring_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_payments
    ADD CONSTRAINT recurring_payments_pkey PRIMARY KEY (recurring_id);


--
-- TOC entry 5090 (class 2606 OID 132130)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5092 (class 2606 OID 132132)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 5202 (class 2606 OID 132942)
-- Name: service_request_notes service_request_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_notes
    ADD CONSTRAINT service_request_notes_pkey PRIMARY KEY (note_id);


--
-- TOC entry 5116 (class 2606 OID 132202)
-- Name: service_request_statuses service_request_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_statuses
    ADD CONSTRAINT service_request_statuses_pkey PRIMARY KEY (status_id);


--
-- TOC entry 5118 (class 2606 OID 132204)
-- Name: service_request_statuses service_request_statuses_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_statuses
    ADD CONSTRAINT service_request_statuses_status_name_key UNIQUE (status_name);


--
-- TOC entry 5144 (class 2606 OID 132387)
-- Name: service_request_types service_request_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_types
    ADD CONSTRAINT service_request_types_pkey PRIMARY KEY (type_id);


--
-- TOC entry 5183 (class 2606 OID 132764)
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 5129 (class 2606 OID 132264)
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (state_id);


--
-- TOC entry 5196 (class 2606 OID 132892)
-- Name: survey_options survey_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_options
    ADD CONSTRAINT survey_options_pkey PRIMARY KEY (option_id);


--
-- TOC entry 5208 (class 2606 OID 132998)
-- Name: survey_votes survey_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_votes
    ADD CONSTRAINT survey_votes_pkey PRIMARY KEY (vote_id);


--
-- TOC entry 5174 (class 2606 OID 132658)
-- Name: surveys surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (survey_id);


--
-- TOC entry 5126 (class 2606 OID 132244)
-- Name: user_communities user_communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_pkey PRIMARY KEY (user_id, community_id);


--
-- TOC entry 5096 (class 2606 OID 132151)
-- Name: users users_mobile_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mobile_number_key UNIQUE (mobile_number);


--
-- TOC entry 5098 (class 2606 OID 132149)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5205 (class 2606 OID 132965)
-- Name: vendor_assignments vendor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_pkey PRIMARY KEY (assignment_id);


--
-- TOC entry 5190 (class 2606 OID 132844)
-- Name: vendor_feedbacks vendor_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_feedbacks
    ADD CONSTRAINT vendor_feedbacks_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 5156 (class 2606 OID 132505)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id);


--
-- TOC entry 5158 (class 2606 OID 132507)
-- Name: vendors vendors_vendor_access_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_vendor_access_code_key UNIQUE (vendor_access_code);


--
-- TOC entry 5199 (class 2606 OID 132912)
-- Name: violation_documents violation_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_documents
    ADD CONSTRAINT violation_documents_pkey PRIMARY KEY (violation_document_id);


--
-- TOC entry 5111 (class 2606 OID 132190)
-- Name: violation_statuses violation_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_statuses
    ADD CONSTRAINT violation_statuses_pkey PRIMARY KEY (violation_status_id);


--
-- TOC entry 5113 (class 2606 OID 132192)
-- Name: violation_statuses violation_statuses_violation_status_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_statuses
    ADD CONSTRAINT violation_statuses_violation_status_key UNIQUE (violation_status);


--
-- TOC entry 5138 (class 2606 OID 132339)
-- Name: violation_types violation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_types
    ADD CONSTRAINT violation_types_pkey PRIMARY KEY (violation_type_id);


--
-- TOC entry 5180 (class 2606 OID 132711)
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (violation_id);


--
-- TOC entry 5186 (class 1259 OID 133065)
-- Name: idx_amenity_booking_unique_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_amenity_booking_unique_slot ON public.amenity_bookings USING btree (amenity_id, booking_date, slot_number) WHERE ((active_status = true) AND ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying])::text[])));


--
-- TOC entry 5177 (class 1259 OID 132695)
-- Name: ix_addresses_address_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_addresses_address_id ON public.addresses USING btree (address_id);


--
-- TOC entry 5147 (class 1259 OID 132428)
-- Name: ix_amenities_amenity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_amenities_amenity_id ON public.amenities USING btree (amenity_id);


--
-- TOC entry 5187 (class 1259 OID 132829)
-- Name: ix_amenity_bookings_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_amenity_bookings_booking_id ON public.amenity_bookings USING btree (booking_id);


--
-- TOC entry 5121 (class 1259 OID 132218)
-- Name: ix_amenity_types_amenity_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_amenity_types_amenity_type_id ON public.amenity_types USING btree (amenity_type_id);


--
-- TOC entry 5141 (class 1259 OID 132374)
-- Name: ix_audit_logs_audit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_audit_id ON public.audit_logs USING btree (audit_id);


--
-- TOC entry 5108 (class 1259 OID 132181)
-- Name: ix_communities_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_communities_community_id ON public.communities USING btree (community_id);


--
-- TOC entry 5132 (class 1259 OID 132296)
-- Name: ix_community_documents_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_community_documents_document_id ON public.community_documents USING btree (document_id);


--
-- TOC entry 5135 (class 1259 OID 132326)
-- Name: ix_community_join_requests_request_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_community_join_requests_request_id ON public.community_join_requests USING btree (request_id);


--
-- TOC entry 5161 (class 1259 OID 132563)
-- Name: ix_contracts_contract_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_contracts_contract_code ON public.contracts USING btree (contract_code);


--
-- TOC entry 5162 (class 1259 OID 132562)
-- Name: ix_contracts_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_contracts_contract_id ON public.contracts USING btree (contract_id);


--
-- TOC entry 5103 (class 1259 OID 132165)
-- Name: ix_countries_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_countries_country_id ON public.countries USING btree (country_id);


--
-- TOC entry 5153 (class 1259 OID 132488)
-- Name: ix_faqs_faq_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_faqs_faq_id ON public.faqs USING btree (faq_id);


--
-- TOC entry 5191 (class 1259 OID 132882)
-- Name: ix_meeting_rsvps_rsvp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_meeting_rsvps_rsvp_id ON public.meeting_rsvps USING btree (rsvp_id);


--
-- TOC entry 5169 (class 1259 OID 132643)
-- Name: ix_meetings_meeting_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_meetings_meeting_id ON public.meetings USING btree (meeting_id);


--
-- TOC entry 5148 (class 1259 OID 132458)
-- Name: ix_news_news_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_news_news_id ON public.news USING btree (news_id);


--
-- TOC entry 5122 (class 1259 OID 132237)
-- Name: ix_otp_tokens_otp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_otp_tokens_otp_id ON public.otp_tokens USING btree (otp_id);


--
-- TOC entry 5163 (class 1259 OID 132587)
-- Name: ix_payments_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payments_payment_id ON public.payments USING btree (payment_id);


--
-- TOC entry 5166 (class 1259 OID 132612)
-- Name: ix_recurring_payments_recurring_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recurring_payments_recurring_id ON public.recurring_payments USING btree (recurring_id);


--
-- TOC entry 5088 (class 1259 OID 132133)
-- Name: ix_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_roles_role_id ON public.roles USING btree (role_id);


--
-- TOC entry 5200 (class 1259 OID 132953)
-- Name: ix_service_request_notes_note_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_request_notes_note_id ON public.service_request_notes USING btree (note_id);


--
-- TOC entry 5114 (class 1259 OID 132205)
-- Name: ix_service_request_statuses_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_request_statuses_status_id ON public.service_request_statuses USING btree (status_id);


--
-- TOC entry 5142 (class 1259 OID 132393)
-- Name: ix_service_request_types_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_request_types_type_id ON public.service_request_types USING btree (type_id);


--
-- TOC entry 5181 (class 1259 OID 132790)
-- Name: ix_service_requests_request_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_requests_request_id ON public.service_requests USING btree (request_id);


--
-- TOC entry 5127 (class 1259 OID 132270)
-- Name: ix_states_state_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_states_state_id ON public.states USING btree (state_id);


--
-- TOC entry 5194 (class 1259 OID 132898)
-- Name: ix_survey_options_option_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_survey_options_option_id ON public.survey_options USING btree (option_id);


--
-- TOC entry 5206 (class 1259 OID 133014)
-- Name: ix_survey_votes_vote_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_survey_votes_vote_id ON public.survey_votes USING btree (vote_id);


--
-- TOC entry 5172 (class 1259 OID 132674)
-- Name: ix_surveys_survey_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_surveys_survey_id ON public.surveys USING btree (survey_id);


--
-- TOC entry 5093 (class 1259 OID 132153)
-- Name: ix_users_email_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email_id ON public.users USING btree (email_id);


--
-- TOC entry 5094 (class 1259 OID 132152)
-- Name: ix_users_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_user_id ON public.users USING btree (user_id);


--
-- TOC entry 5203 (class 1259 OID 132986)
-- Name: ix_vendor_assignments_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendor_assignments_assignment_id ON public.vendor_assignments USING btree (assignment_id);


--
-- TOC entry 5188 (class 1259 OID 132860)
-- Name: ix_vendor_feedbacks_feedback_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendor_feedbacks_feedback_id ON public.vendor_feedbacks USING btree (feedback_id);


--
-- TOC entry 5154 (class 1259 OID 132523)
-- Name: ix_vendors_vendor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vendors_vendor_id ON public.vendors USING btree (vendor_id);


--
-- TOC entry 5197 (class 1259 OID 132928)
-- Name: ix_violation_documents_violation_document_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_violation_documents_violation_document_id ON public.violation_documents USING btree (violation_document_id);


--
-- TOC entry 5109 (class 1259 OID 132193)
-- Name: ix_violation_statuses_violation_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_violation_statuses_violation_status_id ON public.violation_statuses USING btree (violation_status_id);


--
-- TOC entry 5136 (class 1259 OID 132355)
-- Name: ix_violation_types_violation_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_violation_types_violation_type_id ON public.violation_types USING btree (violation_type_id);


--
-- TOC entry 5178 (class 1259 OID 132747)
-- Name: ix_violations_violation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_violations_violation_id ON public.violations USING btree (violation_id);


--
-- TOC entry 5261 (class 2606 OID 132690)
-- Name: addresses addresses_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(country_id);


--
-- TOC entry 5262 (class 2606 OID 132685)
-- Name: addresses addresses_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(state_id);


--
-- TOC entry 5233 (class 2606 OID 132413)
-- Name: amenities amenities_amenity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_amenity_type_id_fkey FOREIGN KEY (amenity_type_id) REFERENCES public.amenity_types(amenity_type_id);


--
-- TOC entry 5234 (class 2606 OID 132408)
-- Name: amenities amenities_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5235 (class 2606 OID 132418)
-- Name: amenities amenities_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5236 (class 2606 OID 132423)
-- Name: amenities amenities_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5275 (class 2606 OID 132809)
-- Name: amenity_bookings amenity_bookings_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings
    ADD CONSTRAINT amenity_bookings_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(amenity_id);


--
-- TOC entry 5276 (class 2606 OID 132819)
-- Name: amenity_bookings amenity_bookings_booked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings
    ADD CONSTRAINT amenity_bookings_booked_by_id_fkey FOREIGN KEY (booked_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5277 (class 2606 OID 132824)
-- Name: amenity_bookings amenity_bookings_cancelled_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings
    ADD CONSTRAINT amenity_bookings_cancelled_by_id_fkey FOREIGN KEY (cancelled_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5278 (class 2606 OID 132814)
-- Name: amenity_bookings amenity_bookings_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenity_bookings
    ADD CONSTRAINT amenity_bookings_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5231 (class 2606 OID 132369)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5212 (class 2606 OID 133030)
-- Name: communities communities_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(address_id);


--
-- TOC entry 5213 (class 2606 OID 133060)
-- Name: communities communities_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5214 (class 2606 OID 133045)
-- Name: communities communities_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5215 (class 2606 OID 133055)
-- Name: communities communities_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5216 (class 2606 OID 133015)
-- Name: communities communities_president_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_president_user_id_fkey FOREIGN KEY (president_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5217 (class 2606 OID 133025)
-- Name: communities communities_secretary_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_secretary_user_id_fkey FOREIGN KEY (secretary_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5218 (class 2606 OID 133040)
-- Name: communities communities_treasurer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_treasurer_user_id_fkey FOREIGN KEY (treasurer_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5223 (class 2606 OID 132286)
-- Name: community_documents community_documents_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_documents
    ADD CONSTRAINT community_documents_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5224 (class 2606 OID 132291)
-- Name: community_documents community_documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_documents
    ADD CONSTRAINT community_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5225 (class 2606 OID 132316)
-- Name: community_join_requests community_join_requests_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5226 (class 2606 OID 132321)
-- Name: community_join_requests community_join_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id);


--
-- TOC entry 5227 (class 2606 OID 132311)
-- Name: community_join_requests community_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5246 (class 2606 OID 132552)
-- Name: contracts contracts_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5247 (class 2606 OID 132557)
-- Name: contracts contracts_last_updated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_last_updated_by_id_fkey FOREIGN KEY (last_updated_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5248 (class 2606 OID 132542)
-- Name: contracts contracts_onboarded_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_onboarded_community_id_fkey FOREIGN KEY (onboarded_community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5249 (class 2606 OID 132547)
-- Name: contracts contracts_onboarded_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_onboarded_user_id_fkey FOREIGN KEY (onboarded_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5250 (class 2606 OID 132537)
-- Name: contracts contracts_sales_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_sales_agent_id_fkey FOREIGN KEY (sales_agent_id) REFERENCES public.users(user_id);


--
-- TOC entry 5240 (class 2606 OID 132473)
-- Name: faqs faqs_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5241 (class 2606 OID 132478)
-- Name: faqs faqs_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5242 (class 2606 OID 132483)
-- Name: faqs faqs_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5282 (class 2606 OID 132872)
-- Name: meeting_rsvps meeting_rsvps_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(meeting_id);


--
-- TOC entry 5283 (class 2606 OID 132877)
-- Name: meeting_rsvps meeting_rsvps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_rsvps
    ADD CONSTRAINT meeting_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5255 (class 2606 OID 132628)
-- Name: meetings meetings_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5256 (class 2606 OID 132633)
-- Name: meetings meetings_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5257 (class 2606 OID 132638)
-- Name: meetings meetings_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5237 (class 2606 OID 132443)
-- Name: news news_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5238 (class 2606 OID 132448)
-- Name: news news_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5239 (class 2606 OID 132453)
-- Name: news news_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5219 (class 2606 OID 132232)
-- Name: otp_tokens otp_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_tokens
    ADD CONSTRAINT otp_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5251 (class 2606 OID 132577)
-- Name: payments payments_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5252 (class 2606 OID 132582)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5253 (class 2606 OID 132602)
-- Name: recurring_payments recurring_payments_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_payments
    ADD CONSTRAINT recurring_payments_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5254 (class 2606 OID 132607)
-- Name: recurring_payments recurring_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_payments
    ADD CONSTRAINT recurring_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5288 (class 2606 OID 132948)
-- Name: service_request_notes service_request_notes_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_notes
    ADD CONSTRAINT service_request_notes_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5289 (class 2606 OID 132943)
-- Name: service_request_notes service_request_notes_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_notes
    ADD CONSTRAINT service_request_notes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(request_id);


--
-- TOC entry 5232 (class 2606 OID 132388)
-- Name: service_request_types service_request_types_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_request_types
    ADD CONSTRAINT service_request_types_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5270 (class 2606 OID 132765)
-- Name: service_requests service_requests_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5271 (class 2606 OID 132785)
-- Name: service_requests service_requests_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5272 (class 2606 OID 132780)
-- Name: service_requests service_requests_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.service_request_statuses(status_id);


--
-- TOC entry 5273 (class 2606 OID 132775)
-- Name: service_requests service_requests_submitted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_submitted_by_id_fkey FOREIGN KEY (submitted_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5274 (class 2606 OID 132770)
-- Name: service_requests service_requests_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.service_request_types(type_id);


--
-- TOC entry 5222 (class 2606 OID 132265)
-- Name: states states_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(country_id);


--
-- TOC entry 5284 (class 2606 OID 132893)
-- Name: survey_options survey_options_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_options
    ADD CONSTRAINT survey_options_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(survey_id);


--
-- TOC entry 5294 (class 2606 OID 133004)
-- Name: survey_votes survey_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_votes
    ADD CONSTRAINT survey_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.survey_options(option_id);


--
-- TOC entry 5295 (class 2606 OID 132999)
-- Name: survey_votes survey_votes_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_votes
    ADD CONSTRAINT survey_votes_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.surveys(survey_id);


--
-- TOC entry 5296 (class 2606 OID 133009)
-- Name: survey_votes survey_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_votes
    ADD CONSTRAINT survey_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5258 (class 2606 OID 132659)
-- Name: surveys surveys_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5259 (class 2606 OID 132664)
-- Name: surveys surveys_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5260 (class 2606 OID 132669)
-- Name: surveys surveys_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.surveys
    ADD CONSTRAINT surveys_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5220 (class 2606 OID 132250)
-- Name: user_communities user_communities_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id) ON DELETE CASCADE;


--
-- TOC entry 5221 (class 2606 OID 132245)
-- Name: user_communities user_communities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_communities
    ADD CONSTRAINT user_communities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 133020)
-- Name: users users_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5210 (class 2606 OID 133050)
-- Name: users users_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5211 (class 2606 OID 133035)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- TOC entry 5290 (class 2606 OID 132981)
-- Name: vendor_assignments vendor_assignments_assigned_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_assigned_by_id_fkey FOREIGN KEY (assigned_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5291 (class 2606 OID 132976)
-- Name: vendor_assignments vendor_assignments_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5292 (class 2606 OID 132971)
-- Name: vendor_assignments vendor_assignments_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.service_requests(request_id);


--
-- TOC entry 5293 (class 2606 OID 132966)
-- Name: vendor_assignments vendor_assignments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_assignments
    ADD CONSTRAINT vendor_assignments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- TOC entry 5279 (class 2606 OID 132850)
-- Name: vendor_feedbacks vendor_feedbacks_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_feedbacks
    ADD CONSTRAINT vendor_feedbacks_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5280 (class 2606 OID 132855)
-- Name: vendor_feedbacks vendor_feedbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_feedbacks
    ADD CONSTRAINT vendor_feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5281 (class 2606 OID 132845)
-- Name: vendor_feedbacks vendor_feedbacks_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendor_feedbacks
    ADD CONSTRAINT vendor_feedbacks_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- TOC entry 5243 (class 2606 OID 132513)
-- Name: vendors vendors_added_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_added_by_id_fkey FOREIGN KEY (added_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5244 (class 2606 OID 132508)
-- Name: vendors vendors_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5245 (class 2606 OID 132518)
-- Name: vendors vendors_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5285 (class 2606 OID 132918)
-- Name: violation_documents violation_documents_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_documents
    ADD CONSTRAINT violation_documents_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5286 (class 2606 OID 132923)
-- Name: violation_documents violation_documents_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_documents
    ADD CONSTRAINT violation_documents_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5287 (class 2606 OID 132913)
-- Name: violation_documents violation_documents_violation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_documents
    ADD CONSTRAINT violation_documents_violation_id_fkey FOREIGN KEY (violation_id) REFERENCES public.violations(violation_id);


--
-- TOC entry 5228 (class 2606 OID 132340)
-- Name: violation_types violation_types_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_types
    ADD CONSTRAINT violation_types_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5229 (class 2606 OID 132345)
-- Name: violation_types violation_types_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_types
    ADD CONSTRAINT violation_types_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5230 (class 2606 OID 132350)
-- Name: violation_types violation_types_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violation_types
    ADD CONSTRAINT violation_types_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5263 (class 2606 OID 132722)
-- Name: violations violations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(user_id);


--
-- TOC entry 5264 (class 2606 OID 132717)
-- Name: violations violations_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id);


--
-- TOC entry 5265 (class 2606 OID 132737)
-- Name: violations violations_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5266 (class 2606 OID 132732)
-- Name: violations violations_dispute_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_dispute_resolved_by_fkey FOREIGN KEY (dispute_resolved_by) REFERENCES public.users(user_id);


--
-- TOC entry 5267 (class 2606 OID 132742)
-- Name: violations violations_modified_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_modified_by_id_fkey FOREIGN KEY (modified_by_id) REFERENCES public.users(user_id);


--
-- TOC entry 5268 (class 2606 OID 132727)
-- Name: violations violations_violation_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_violation_status_id_fkey FOREIGN KEY (violation_status_id) REFERENCES public.violation_statuses(violation_status_id);


--
-- TOC entry 5269 (class 2606 OID 132712)
-- Name: violations violations_violation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_violation_type_id_fkey FOREIGN KEY (violation_type_id) REFERENCES public.violation_types(violation_type_id);


-- Completed on 2026-06-04 20:02:23

--
-- PostgreSQL database dump complete
--

\unrestrict NvrriSPNtKlLWAM0hAPY0qzpH5TX3Q7HhWhS4htl02PHze8hWR0Uh1htEX7LZPY

