const photo = (id: string, width = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export const DEMO_CATEGORIES = [
  { id: -1, name: 'Medicines', image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220) },
  { id: -2, name: 'Vitamins & Supplements', image_full_url: photo('photo-1571781926291-c477ebfd024b', 220) },
  { id: -3, name: 'Personal Care', image_full_url: photo('photo-1608248543803-ba4f8c70ae0b', 220) },
  { id: -4, name: 'Baby Care', image_full_url: photo('photo-1604917877934-07d8d248d396', 220) },
  { id: -5, name: 'First Aid', image_full_url: photo('photo-1603398938378-e54eab446dde', 220) },
  { id: -6, name: 'Medical Devices', image_full_url: photo('photo-1584634731339-252c581abfc5', 220) },
];

const product = (id: number, name: string, category_id: number, price: number, unit: string, image: string, description: string, discount?: number) => ({
  id: -100 - id, name, category_id, category_name: DEMO_CATEGORIES.find((item) => item.id === category_id)?.name,
  price, discount_price: discount ?? null, unit, description, stock: 15 + (id % 20), medicine_type: 'otc', is_demo: true,
  thumbnail_full_url: photo(image),
});

export const DEMO_PRODUCTS = [
  product(1, 'Paracetamol 500 mg', -1, 32, 'Strip of 10 tablets', 'photo-1584308666744-24d5c474f2ae', 'Pain and fever relief tablets. Sample listing for client demonstration.', 28),
  product(2, 'Cetirizine 10 mg', -1, 48, 'Strip of 10 tablets', 'photo-1576602976047-174e57a47881', 'Everyday allergy relief. Sample listing for client demonstration.', 42),
  product(3, 'Antacid Chewable Tablets', -1, 95, 'Pack of 30 tablets', 'photo-1550572017-edd951b55104', 'Mint flavoured antacid tablets. Sample listing for client demonstration.', 79),
  product(4, 'Vitamin C + Zinc', -2, 249, 'Bottle of 30 tablets', 'photo-1571781926291-c477ebfd024b', 'Daily wellness supplement. Sample listing for client demonstration.', 199),
  product(5, 'Daily Multivitamin', -2, 399, 'Bottle of 60 tablets', 'photo-1556229010-6c3f2c9ca5f8', 'A daily multivitamin supplement. Sample listing for client demonstration.', 349),
  product(6, 'Omega 3 Fish Oil', -2, 549, 'Bottle of 30 capsules', 'photo-1571781926291-c477ebfd024b', 'Omega 3 supplement. Sample listing for client demonstration.', 499),
  product(7, 'Aloe Vera Moisturizer', -3, 225, 'Bottle of 200 ml', 'photo-1608248543803-ba4f8c70ae0b', 'Light daily moisturizing lotion. Sample listing for client demonstration.', 189),
  product(8, 'Gentle Face Cleanser', -3, 299, 'Bottle of 150 ml', 'photo-1556229010-6c3f2c9ca5f8', 'Gentle everyday face wash. Sample listing for client demonstration.', 259),
  product(9, 'Hand Sanitizer', -3, 65, 'Bottle of 100 ml', 'photo-1603398938378-e54eab446dde', 'Pocket friendly hand sanitizer. Sample listing for client demonstration.', 55),
  product(10, 'Gentle Baby Lotion', -4, 189, 'Bottle of 200 ml', 'photo-1604917877934-07d8d248d396', 'Gentle daily care for delicate skin. Sample listing for client demonstration.', 169),
  product(11, 'Baby Shampoo', -4, 210, 'Bottle of 200 ml', 'photo-1604917877934-07d8d248d396', 'Tear free baby shampoo. Sample listing for client demonstration.', 185),
  product(12, 'Baby Diaper Rash Cream', -4, 175, 'Tube of 50 g', 'photo-1556229010-6c3f2c9ca5f8', 'Gentle protective baby cream. Sample listing for client demonstration.', 149),
  product(13, 'Antiseptic Liquid', -5, 85, 'Bottle of 100 ml', 'photo-1603398938378-e54eab446dde', 'Everyday first aid antiseptic. Sample listing for client demonstration.', 75),
  product(14, 'Sterile Gauze Dressing', -5, 110, 'Pack of 10', 'photo-1584634731339-252c581abfc5', 'Sterile gauze for first aid. Sample listing for client demonstration.', 95),
  product(15, 'Adhesive Bandages', -5, 60, 'Pack of 20', 'photo-1603398938378-e54eab446dde', 'Flexible adhesive bandages. Sample listing for client demonstration.', 49),
  product(16, 'Digital Thermometer', -6, 299, '1 unit', 'photo-1584634731339-252c581abfc5', 'Fast reading digital thermometer. Sample listing for client demonstration.', 249),
  product(17, 'Automatic BP Monitor', -6, 1899, '1 unit', 'photo-1584634731339-252c581abfc5', 'Digital upper arm blood pressure monitor. Sample listing for client demonstration.', 1599),
  product(18, 'Pulse Oximeter', -6, 999, '1 unit', 'photo-1584634731339-252c581abfc5', 'Finger pulse oximeter for spot checks. Sample listing for client demonstration.', 799),
];

export const DEMO_BANNERS = [{ id: -1, title: 'Everyday health, made easier.', subtitle: 'Explore sample products and services in this interactive demo.', action_text: 'EXPLORE DEMO' }];

export const DEMO_DOCTORS = [
  { id: -201, name: 'Aarav Mehta', speciality: 'General Physician', qualification: 'MBBS, MD', business_name: 'Amedix Demo Clinic', consultation_fee: 499, availability_text: 'Today, 10:00 AM – 6:00 PM', description: 'General health, fever and preventive care. Sample doctor profile.', image_full_url: photo('photo-1612349317150-e413f6a5b16d', 240) },
  { id: -202, name: 'Nisha Kapoor', speciality: 'Dermatologist', qualification: 'MBBS, MD Dermatology', business_name: 'Amedix Demo Clinic', consultation_fee: 699, availability_text: 'Tomorrow, 9:00 AM – 2:00 PM', description: 'Skin and hair consultations. Sample doctor profile.', image_full_url: photo('photo-1559839734-2b71ea197ec2', 240) },
  { id: -203, name: 'Rohan Iyer', speciality: 'Paediatrician', qualification: 'MBBS, DCH', business_name: 'Amedix Demo Clinic', consultation_fee: 599, availability_text: 'Today, 11:00 AM – 4:00 PM', description: 'Child wellness and paediatric care. Sample doctor profile.', image_full_url: photo('photo-1622253692010-333f2da6031d', 240) },
  { id: -204, name: 'Ananya Rao', speciality: 'Cardiologist', qualification: 'MBBS, DM Cardiology', business_name: 'Amedix Demo Clinic', consultation_fee: 899, availability_text: 'Tomorrow, 10:00 AM – 1:00 PM', description: 'Heart health and preventive consultations. Sample doctor profile.', image_full_url: photo('photo-1582750433449-648ed127bb54', 240) },
];

export const DEMO_LABS = [
  { id: -301, name: 'Complete Blood Count (CBC)', provider_name: 'Amedix Demo Diagnostics', description: 'Routine blood panel with sample collection at home.', price: 399, report_hours: 12 },
  { id: -302, name: 'Thyroid Profile (T3, T4, TSH)', provider_name: 'Amedix Demo Diagnostics', description: 'Thyroid function screening. Sample test listing.', price: 599, report_hours: 24 },
  { id: -303, name: 'Vitamin D Test', provider_name: 'Amedix Demo Diagnostics', description: 'Vitamin D level screening. Sample test listing.', price: 799, report_hours: 24 },
  { id: -304, name: 'Lipid Profile', provider_name: 'Amedix Demo Diagnostics', description: 'Cholesterol and triglyceride screening. Sample test listing.', price: 499, report_hours: 18 },
];
