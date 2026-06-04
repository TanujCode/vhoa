import random
from datetime import datetime, timedelta

def escape_sql(text):
    return text.replace("'", "''")

def generate_sql():
    sql = ["-- Massive Dummy Data Generation Script", "BEGIN;"]
    
    # 1. 20 Communities
    community_codes = []
    for i in range(1, 21):
        code = f"MEGA{i:03d}"
        community_codes.append(code)
        name = f"Grand Community Phase {i}"
        sql.append(f"""
        INSERT INTO communities (
            name, community_code, address_id, plan_id, license_status, 
            community_size, total_owners, contact_person, time_zone, 
            amenity_fee_enabled, violation_fee_enabled, late_fee_enabled, 
            active_status, created_date
        ) VALUES (
            '{name}', '{code}', NULL, 1, 'ACTIVE', 
            {random.randint(100, 500)}, {random.randint(90, 480)}, 'Manager {i}', 'America/New_York', 
            true, true, true, true, NOW()
        );
        """)

    # 2. Amenity Types
    amenity_types = ['Pool', 'Gym', 'Clubhouse', 'Tennis Court', 'BBQ Area', 'Playground', 'Dog Park', 'Sauna', 'Theater Room', 'Business Center']
    for i, atype in enumerate(amenity_types, 1):
        sql.append(f"""
        INSERT INTO amenity_types (type_name, description, active_status, created_date) 
        VALUES ('{atype}', 'Luxury {atype} Area', true, NOW()) ON CONFLICT DO NOTHING;
        """)

    # 3. Amenities, Violations, Service Requests, etc per community
    for code in community_codes:
        c_id_query = f"(SELECT community_id FROM communities WHERE community_code = '{code}')"
        u_id_query = "(SELECT user_id FROM users ORDER BY random() LIMIT 1)"
        
        # Amenities
        for i in range(5):
            atype = random.choice(amenity_types)
            sql.append(f"""
            INSERT INTO amenities (
                community_id, amenity_type_id, name, description, location, 
                capacity, fee_enabled, booking_fee, active_status, created_date
            ) VALUES (
                {c_id_query}, (SELECT amenity_type_id FROM amenity_types WHERE type_name = '{atype}' LIMIT 1),
                '{atype} {i+1} at {code}', 'Premium {atype}', 'Zone {random.randint(1,5)}',
                {random.randint(10, 100)}, {random.choice(['true', 'false'])}, {random.randint(0, 50)}, true, NOW()
            );
            """)

        # Violation Types
        v_types = ['Noise', 'Parking', 'Trash', 'Pets', 'Architecture', 'Landscaping', 'Speeding', 'Smoking', 'Signage', 'Pool Rules']
        for vt in v_types:
            sql.append(f"""
            INSERT INTO violation_types (
                name, description, amount, late_charge, due_days, community_id, active_status, created_date
            ) VALUES (
                '{vt} Violation', 'Standard {vt} Infraction', {random.randint(25, 200)}, 15.0, 30, {c_id_query}, true, NOW()
            );
            """)
            
        # Violations (50 per community)
        for i in range(50):
            vt = random.choice(v_types) + ' Violation'
            status_id = random.randint(1, 7) # Assuming 1-7 are standard statuses
            sql.append(f"""
            INSERT INTO violations (
                violation_type_id, violation_date, violation_due_date, community_id, 
                amount, client_id, violation_status_id, remarks, active_status, created_date
            ) VALUES (
                (SELECT violation_type_id FROM violation_types WHERE name = '{vt}' AND community_id = {c_id_query} LIMIT 1),
                CURRENT_DATE - INTERVAL '{random.randint(1, 100)} days', 
                CURRENT_DATE + INTERVAL '{random.randint(-10, 30)} days', 
                {c_id_query}, {random.randint(25, 200)}, {u_id_query}, {status_id}, 
                'Automated violation entry #{i}', true, NOW()
            );
            """)

        # Service Request Types
        sr_types = ['Plumbing', 'Electrical', 'HVAC', 'Landscaping', 'General', 'Pest Control']
        for srt in sr_types:
            sql.append(f"""
            INSERT INTO service_request_types (type_name, description, community_id, active_status, created_date) 
            VALUES ('{srt} Issue', 'Standard {srt} Request', {c_id_query}, true, NOW());
            """)

        # Service Requests (50 per community)
        for i in range(50):
            srt = random.choice(sr_types) + ' Issue'
            status_id = random.randint(1, 6) # Assuming 1-6 statuses
            sql.append(f"""
            INSERT INTO service_requests (
                community_id, type_id, title, description, submitted_by_id, 
                status_id, priority, active_status, created_date
            ) VALUES (
                {c_id_query}, 
                (SELECT type_id FROM service_request_types WHERE type_name = '{srt}' AND community_id = {c_id_query} LIMIT 1), 
                'Fix {srt} #{i}', 'Please resolve this issue ASAP.', {u_id_query}, 
                {status_id}, '{random.choice(['LOW', 'NORMAL', 'HIGH', 'URGENT'])}', true, NOW()
            );
            """)

        # FAQs (10 per community)
        for i in range(10):
            sql.append(f"""
            INSERT INTO faqs (community_id, question, answer, order_index, active_status, created_date) VALUES 
            ({c_id_query}, 'Common Question #{i}?', 'This is the standard answer for question #{i}.', {i}, true, NOW());
            """)

        # News (20 per community)
        for i in range(20):
            sql.append(f"""
            INSERT INTO news (community_id, title, content, category, is_pinned, active_status, created_date) VALUES 
            ({c_id_query}, 'Community Update #{i}', 'Here is the latest news happening around the neighborhood...', '{random.choice(['Event', 'Maintenance', 'Alert'])}', {random.choice(['true', 'false'])}, true, NOW());
            """)

        # Meetings (10 per community)
        for i in range(10):
            sql.append(f"""
            INSERT INTO meetings (community_id, title, description, meeting_date, location, active_status, created_date) VALUES 
            ({c_id_query}, 'Board Meeting #{i}', 'Monthly discussion.', CURRENT_DATE + INTERVAL '{random.randint(1, 60)} days', 'Main Hall', true, NOW());
            """)

    sql.append("COMMIT;")
    
    with open('large_dummy_data.sql', 'w') as f:
        f.write("\n".join(sql))
        
if __name__ == "__main__":
    generate_sql()
    print("Successfully generated large_dummy_data.sql")
