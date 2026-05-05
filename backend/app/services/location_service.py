from sqlalchemy.orm import Session
from app.models.community import Country, State


def seed_locations(db: Session):

    #USA
    usa = db.query(Country).filter(Country.country_code == "US").first()
    if not usa:
        usa = Country(country_name="United States", country_code="US")
        db.add(usa)
        db.flush()

        us_states = [
            ("Alabama", "AL"), ("Alaska", "AK"), ("Arizona", "AZ"),
            ("Arkansas", "AR"), ("California", "CA"), ("Colorado", "CO"),
            ("Connecticut", "CT"), ("Delaware", "DE"), ("Florida", "FL"),
            ("Georgia", "GA"), ("Hawaii", "HI"), ("Idaho", "ID"),
            ("Illinois", "IL"), ("Indiana", "IN"), ("Iowa", "IA"),
            ("Kansas", "KS"), ("Kentucky", "KY"), ("Louisiana", "LA"),
            ("Maine", "ME"), ("Maryland", "MD"), ("Massachusetts", "MA"),
            ("Michigan", "MI"), ("Minnesota", "MN"), ("Mississippi", "MS"),
            ("Missouri", "MO"), ("Montana", "MT"), ("Nebraska", "NE"),
            ("Nevada", "NV"), ("New Hampshire", "NH"), ("New Jersey", "NJ"),
            ("New Mexico", "NM"), ("New York", "NY"), ("North Carolina", "NC"),
            ("North Dakota", "ND"), ("Ohio", "OH"), ("Oklahoma", "OK"),
            ("Oregon", "OR"), ("Pennsylvania", "PA"), ("Rhode Island", "RI"),
            ("South Carolina", "SC"), ("South Dakota", "SD"), ("Tennessee", "TN"),
            ("Texas", "TX"), ("Utah", "UT"), ("Vermont", "VT"),
            ("Virginia", "VA"), ("Washington", "WA"), ("West Virginia", "WV"),
            ("Wisconsin", "WI"), ("Wyoming", "WY"),
        ]
        for name, code in us_states:
            db.add(State(state_name=name, state_code=code, country_id=usa.country_id))

    #India 
    india = db.query(Country).filter(Country.country_code == "IN").first()
    if not india:
        india = Country(country_name="India", country_code="IN")
        db.add(india)
        db.flush()

        india_states = [
            ("Andhra Pradesh", "AP"), ("Arunachal Pradesh", "AR"),
            ("Assam", "AS"), ("Bihar", "BR"), ("Chhattisgarh", "CG"),
            ("Goa", "GA"), ("Gujarat", "GJ"), ("Haryana", "HR"),
            ("Himachal Pradesh", "HP"), ("Jharkhand", "JH"),
            ("Karnataka", "KA"), ("Kerala", "KL"), ("Madhya Pradesh", "MP"),
            ("Maharashtra", "MH"), ("Manipur", "MN"), ("Meghalaya", "ML"),
            ("Mizoram", "MZ"), ("Nagaland", "NL"), ("Odisha", "OD"),
            ("Punjab", "PB"), ("Rajasthan", "RJ"), ("Sikkim", "SK"),
            ("Tamil Nadu", "TN"), ("Telangana", "TG"), ("Tripura", "TR"),
            ("Uttar Pradesh", "UP"), ("Uttarakhand", "UK"), ("West Bengal", "WB"),
        ]
        for name, code in india_states:
            db.add(State(state_name=name, state_code=code, country_id=india.country_id))

    db.commit()
    print("Countries and States seeded.")