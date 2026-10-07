const photo = (id: string, width = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

export type DemoSubcategory = {
  id: number;
  category_id: number;
  name: string;
  image_full_url?: string;
};

export type DemoCategory = {
  id: number;
  name: string;
  image_full_url?: string;
  subcategories: DemoSubcategory[];
};

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: -1,
    name: 'Medicines',
    image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220),
    subcategories: [
      { id: -101, category_id: -1, name: 'Fever & Pain Relief', image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220) },
      { id: -102, category_id: -1, name: 'Cold, Cough & Flu', image_full_url: photo('photo-1576602976047-174e57a47881', 220) },
      { id: -103, category_id: -1, name: 'Antibiotics & Anti-Infectives', image_full_url: photo('photo-1471864190281-a93a3070b6de', 220) },
      { id: -104, category_id: -1, name: 'Diabetes Care', image_full_url: photo('photo-1615485290382-441e4d049cb5', 220) },
      { id: -105, category_id: -1, name: 'Cardiac & Blood Pressure', image_full_url: photo('photo-1505751172876-fa1923c5c528', 220) },
      { id: -106, category_id: -1, name: 'Gastrointestinal & Digestion', image_full_url: photo('photo-1550572017-edd951b55104', 220) },
    ],
  },
  {
    id: -2,
    name: 'OTC',
    image_full_url: photo('photo-1584017911766-d451b3d0e843', 220),
    subcategories: [
      { id: -201, category_id: -2, name: 'Pain Relief Balms & Sprays', image_full_url: photo('photo-1584017911766-d451b3d0e843', 220) },
      { id: -202, category_id: -2, name: 'Cough Lozenges & Syrups', image_full_url: photo('photo-1550572017-edd951b55104', 220) },
      { id: -203, category_id: -2, name: 'Daily Vitamins & Multivitamins', image_full_url: photo('photo-1571781926291-c477ebfd024b', 220) },
      { id: -204, category_id: -2, name: 'First Aid & Antiseptics', image_full_url: photo('photo-1603398938378-e54eab446dde', 220) },
      { id: -205, category_id: -2, name: 'Energy & Electrolytes', image_full_url: photo('photo-1556228720-195a672e8a03', 220) },
    ],
  },
  {
    id: -3,
    name: 'Personal & Beauty Care',
    image_full_url: photo('photo-1608248543803-ba4f8c70ae0b', 220),
    subcategories: [
      { id: -301, category_id: -3, name: 'Skin Care & Moisturizers', image_full_url: photo('photo-1608248543803-ba4f8c70ae0b', 220) },
      { id: -302, category_id: -3, name: 'Hair Care & Shampoos', image_full_url: photo('photo-1535585209827-a15fcdbc4c2d', 220) },
      { id: -303, category_id: -3, name: 'Oral Care & Toothpastes', image_full_url: photo('photo-1559599101-f09722fb4948', 220) },
      { id: -304, category_id: -3, name: 'Bath & Body Hygiene', image_full_url: photo('photo-1556228722-d0b5d92df9fd', 220) },
      { id: -305, category_id: -3, name: 'Sunscreen & Protection', image_full_url: photo('photo-1598440947619-2c35fc9aa908', 220) },
    ],
  },
  {
    id: -4,
    name: 'Medical & Surgical Care',
    image_full_url: photo('photo-1584634731339-252c581abfc5', 220),
    subcategories: [
      { id: -401, category_id: -4, name: 'BP Monitors & Oximeters', image_full_url: photo('photo-1584634731339-252c581abfc5', 220) },
      { id: -402, category_id: -4, name: 'Glucometers & Test Strips', image_full_url: photo('photo-1615485290382-441e4d049cb5', 220) },
      { id: -403, category_id: -4, name: 'Thermometers & Vaporizers', image_full_url: photo('photo-1584634731339-252c581abfc5', 220) },
      { id: -404, category_id: -4, name: 'Bandages, Cotton & Dressings', image_full_url: photo('photo-1603398938378-e54eab446dde', 220) },
      { id: -405, category_id: -4, name: 'Surgical Gloves & Face Masks', image_full_url: photo('photo-1584634731339-252c581abfc5', 220) },
    ],
  },
  {
    id: -5,
    name: 'Baby & Mother Care',
    image_full_url: photo('photo-1604917877934-07d8d248d396', 220),
    subcategories: [
      { id: -501, category_id: -5, name: 'Baby Diapers & Wipes', image_full_url: photo('photo-1604917877934-07d8d248d396', 220) },
      { id: -502, category_id: -5, name: 'Baby Bath & Skin Care', image_full_url: photo('photo-1556229010-6c3f2c9ca5f8', 220) },
      { id: -503, category_id: -5, name: 'Feeding Bottles & Teethers', image_full_url: photo('photo-1516627145497-ae6968895b74', 220) },
      { id: -504, category_id: -5, name: 'Baby Health & Nutrition', image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220) },
      { id: -505, category_id: -5, name: 'Maternity & Mother Care', image_full_url: photo('photo-1544005313-94ddf0286df2', 220) },
    ],
  },
  {
    id: -6,
    name: 'Ayurvedic Herbal Care',
    image_full_url: photo('photo-1617791160505-6f00b51616ec', 220),
    subcategories: [
      { id: -601, category_id: -6, name: 'Chyawanprash & Immunity', image_full_url: photo('photo-1617791160505-6f00b51616ec', 220) },
      { id: -602, category_id: -6, name: 'Herbal Juices (Amla, Aloe, Giloy)', image_full_url: photo('photo-1540420773420-3366772f4999', 220) },
      { id: -603, category_id: -6, name: 'Ayurvedic Pain Relief Oils', image_full_url: photo('photo-1608248543803-ba4f8c70ae0b', 220) },
      { id: -604, category_id: -6, name: 'Pure Herbs (Ashwagandha, Tulsi)', image_full_url: photo('photo-1512069772995-ec65ed45afd6', 220) },
      { id: -605, category_id: -6, name: 'Herbal Digestion & Churnas', image_full_url: photo('photo-1546069901-ba9599a7e63c', 220) },
    ],
  },
  {
    id: -7,
    name: 'Homeopath Care',
    image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220),
    subcategories: [
      { id: -701, category_id: -7, name: 'Homeopathic Dilutions & Potencies', image_full_url: photo('photo-1584308666744-24d5c474f2ae', 220) },
      { id: -702, category_id: -7, name: 'Mother Tinctures', image_full_url: photo('photo-1512069772995-ec65ed45afd6', 220) },
      { id: -703, category_id: -7, name: 'Biochemic Tablets', image_full_url: photo('photo-1584017911766-d451b3d0e843', 220) },
      { id: -704, category_id: -7, name: 'Homeopathic Drops & Syrups', image_full_url: photo('photo-1550572017-edd951b55104', 220) },
      { id: -705, category_id: -7, name: 'Homeopathic Ointments & Gels', image_full_url: photo('photo-1608248543803-ba4f8c70ae0b', 220) },
    ],
  },
];

const product = (
  id: number,
  name: string,
  category_id: number,
  subcategory_id: number,
  price: number,
  unit: string,
  image: string,
  description: string,
  discount?: number
) => {
  const cat = DEMO_CATEGORIES.find((item) => item.id === category_id);
  const sub = cat?.subcategories.find((item) => item.id === subcategory_id);
  return {
    id: -100 - id,
    name,
    category_id,
    category_name: cat?.name ?? 'Healthcare',
    subcategory_id,
    subcategory_name: sub?.name ?? 'General',
    price,
    discount_price: discount ?? null,
    unit,
    description,
    stock: 15 + (id % 20),
    medicine_type: category_id === -1 && subcategory_id === -103 ? 'prescription_required' : 'otc',
    is_demo: true,
    thumbnail_full_url: photo(image),
  };
};

export const DEMO_PRODUCTS = [
  // Category -1: Medicines
  product(1, 'Paracetamol 500 mg', -1, -101, 35, 'Strip of 10 tablets', 'photo-1584308666744-24d5c474f2ae', 'Fast-acting fever and mild-to-moderate pain relief.', 30),
  product(2, 'Ibuprofen 400 mg', -1, -101, 48, 'Strip of 10 tablets', 'photo-1584017911766-d451b3d0e843', 'Anti-inflammatory pain and fever reduction tablet.', 42),
  product(3, 'Cetirizine 10 mg', -1, -102, 45, 'Strip of 10 tablets', 'photo-1576602976047-174e57a47881', 'Non-drowsy relief for running nose, sneezing, and watery eyes.', 38),
  product(4, 'Cheston Cold Relief Tablets', -1, -102, 60, 'Strip of 10 tablets', 'photo-1550572017-edd951b55104', 'Multi-action formula for nasal congestion and cold symptoms.', 52),
  product(5, 'Amoxicillin 500 mg Capsules', -1, -103, 110, 'Strip of 10 capsules', 'photo-1471864190281-a93a3070b6de', 'Prescription antibiotic medicine for bacterial infections.', 95),
  product(6, 'Azithromycin 500 mg Tablets', -1, -103, 160, 'Strip of 3 tablets', 'photo-1584308666744-24d5c474f2ae', 'Broad-spectrum prescription antibiotic tablet.', 145),
  product(7, 'Metformin 500 mg Tablets', -1, -104, 55, 'Strip of 10 tablets', 'photo-1615485290382-441e4d049cb5', 'Blood sugar control tablet for type 2 diabetes management.', 48),
  product(8, 'Glimepiride 1 mg Tablets', -1, -104, 75, 'Strip of 10 tablets', 'photo-1584017911766-d451b3d0e843', 'Oral anti-diabetic medication to regulate glucose levels.', 68),
  product(9, 'Telmisartan 40 mg Tablets', -1, -105, 95, 'Strip of 10 tablets', 'photo-1505751172876-fa1923c5c528', 'Blood pressure management tablet for cardiovascular health.', 84),
  product(10, 'Amlodipine 5 mg Tablets', -1, -105, 42, 'Strip of 10 tablets', 'photo-1584308666744-24d5c474f2ae', 'Calcium channel blocker for hypertension management.', 36),
  product(11, 'Pantoprazole 40 mg Tablets', -1, -106, 85, 'Strip of 10 tablets', 'photo-1550572017-edd951b55104', 'Proton pump inhibitor for acidity and heartburn relief.', 72),
  product(12, 'Digene Antacid Gel Orange', -1, -106, 145, 'Bottle of 200 ml', 'photo-1550572017-edd951b55104', 'Quick antacid soothing gel for acidity, gas and bloat.', 125),

  // Category -2: OTC
  product(13, 'Volini Pain Relief Gel', -2, -201, 135, 'Tube of 30 g', 'photo-1584017911766-d451b3d0e843', 'Quick absorbing pain relief gel for sprains and joint aches.', 119),
  product(14, 'Moov Pain Relief Spray', -2, -201, 160, 'Bottle of 50 g', 'photo-1584017911766-d451b3d0e843', 'Targeted aerosol spray for muscle pain, backache and stiffness.', 140),
  product(15, 'Strepsils Honey & Lemon Lozenges', -2, -202, 50, 'Pack of 8 lozenges', 'photo-1550572017-edd951b55104', 'Soothing throat lozenges with antibacterial action.', 42),
  product(16, 'Vicks Cough Syrup', -2, -202, 110, 'Bottle of 100 ml', 'photo-1576602976047-174e57a47881', 'Non-alcoholic cough relief formula for chesty cough.', 95),
  product(17, 'Vitamin C + Zinc Chewable Tablets', -2, -203, 249, 'Bottle of 30 tablets', 'photo-1571781926291-c477ebfd024b', 'Daily immune protection chewable vitamin tablet.', 199),
  product(18, 'Supradyn Daily Multivitamin', -2, -203, 399, 'Bottle of 60 tablets', 'photo-1556229010-6c3f2c9ca5f8', 'Essential vitamins and minerals for daily energy and stamina.', 349),
  product(19, 'Dettol Antiseptic Liquid', -2, -204, 85, 'Bottle of 100 ml', 'photo-1603398938378-e54eab446dde', 'Trusted germ disinfectant for cuts, scrapes and hygiene.', 75),
  product(20, 'Savlon Antiseptic Cream', -2, -204, 65, 'Tube of 30 g', 'photo-1603398938378-e54eab446dde', 'Healing antiseptic cream for minor cuts, wounds and burns.', 55),
  product(21, 'Electral ORS Powder', -2, -205, 22, 'Sachet of 21.8 g', 'photo-1556228720-195a672e8a03', 'WHO-formulated oral rehydration salts for electrolyte balance.', 20),
  product(22, 'Enerzal Apple Energy Drink', -2, -205, 45, 'Tetra pack 200 ml', 'photo-1556228720-195a672e8a03', 'Instant electrolyte hydration and energy drink.', 40),

  // Category -3: Personal & Beauty Care
  product(23, 'Nivea Soft Moisturizing Cream', -3, -301, 185, 'Jar of 100 ml', 'photo-1608248543803-ba4f8c70ae0b', 'Light refreshing moisturizer with vitamin E and jojoba oil.', 159),
  product(24, 'Cetaphil Gentle Skin Cleanser', -3, -301, 399, 'Bottle of 125 ml', 'photo-1556229010-6c3f2c9ca5f8', 'Hydrating non-foaming face and body cleanser for sensitive skin.', 349),
  product(25, 'Head & Shoulders Anti-Dandruff Shampoo', -3, -302, 220, 'Bottle of 180 ml', 'photo-1535585209827-a15fcdbc4c2d', 'Clinically proven dandruff protection and smooth hair care.', 189),
  product(26, 'Wow Onion Black Seed Hair Oil', -3, -302, 349, 'Bottle of 200 ml', 'photo-1608248543803-ba4f8c70ae0b', 'Cold pressed oil blend for hair fall control and root nourishment.', 299),
  product(27, 'Sensodyne Repair & Protect Toothpaste', -3, -303, 195, 'Tube of 70 g', 'photo-1559599101-f09722fb4948', 'NovaMin calcium technology to relieve sensitivity and protect enamel.', 175),
  product(28, 'Colgate MaxFresh Spicy Fresh Toothpaste', -3, -303, 110, 'Tube of 150 g', 'photo-1559599101-f09722fb4948', 'Cooling crystals for long-lasting freshness and cavity defense.', 95),
  product(29, 'Dettol Original Liquid Handwash', -3, -304, 99, 'Bottle of 200 ml', 'photo-1556228722-d0b5d92df9fd', 'Germ protection handwash with pH balanced moisturizers.', 85),
  product(30, 'Dove Deep Moisture Body Wash', -3, -304, 275, 'Bottle of 250 ml', 'photo-1556228722-d0b5d92df9fd', 'Nourishing microbiome gentle body wash for soft skin.', 235),
  product(31, 'Neutrogena Ultra Sheer Dry-Touch SPF 50+', -3, -305, 300, 'Tube of 30 ml', 'photo-1598440947619-2c35fc9aa908', 'Broad spectrum UVA/UVB lightweight water-resistant sunscreen.', 265),

  // Category -4: Medical & Surgical Care
  product(32, 'Omron Automatic Digital BP Monitor', -4, -401, 1899, '1 unit', 'photo-1584634731339-252c581abfc5', 'Accurate upper arm blood pressure measurement device with memory.', 1599),
  product(33, 'Fingertip Pulse Oximeter', -4, -401, 899, '1 unit', 'photo-1584634731339-252c581abfc5', 'Instant SpO2 oxygen saturation and pulse rate monitor with OLED display.', 699),
  product(34, 'Accu-Chek Active Glucometer Kit', -4, -402, 1299, '1 kit', 'photo-1615485290382-441e4d049cb5', 'Accurate blood glucose meter with lancing device and 10 test strips.', 1099),
  product(35, 'Accu-Chek Active Test Strips 50s', -4, -402, 950, 'Pack of 50 strips', 'photo-1615485290382-441e4d049cb5', 'Reliable test strips for quantitative blood glucose monitoring.', 849),
  product(36, 'Dr. Morepen Digital Thermometer', -4, -403, 199, '1 unit', 'photo-1584634731339-252c581abfc5', 'Quick 60-second oral and underarm digital temperature sensor.', 169),
  product(37, 'HealthSense Steam Vaporizer & Inhaler', -4, -403, 499, '1 unit', 'photo-1584634731339-252c581abfc5', 'Electric warm steam vaporizer for cold, cough and nasal congestion.', 399),
  product(38, 'Cotton Crepe Bandage 10cm x 4m', -4, -404, 120, '1 roll', 'photo-1603398938378-e54eab446dde', 'Elastic compression support bandage for sprains and joints.', 99),
  product(39, 'Sterile Gauze Swabs 7.5cm', -4, -404, 75, 'Pack of 10', 'photo-1584634731339-252c581abfc5', 'Sterilized medical cotton gauze swabs for dressing wounds.', 60),
  product(40, 'Disposable Nitrile Examination Gloves', -4, -405, 349, 'Box of 50 gloves', 'photo-1584634731339-252c581abfc5', 'Latex-free, powder-free non-sterile medical examination gloves.', 299),
  product(41, '3-Ply Protective Face Masks', -4, -405, 120, 'Pack of 50 masks', 'photo-1584634731339-252c581abfc5', 'High-filtration meltblown certified protective face masks.', 89),

  // Category -5: Baby & Mother Care
  product(42, 'Pampers All Round Protection Pants (M)', -5, -501, 499, 'Pack of 34 diapers', 'photo-1604917877934-07d8d248d396', 'Anti-rash baby diaper pants with aloe vera lotion.', 429),
  product(43, 'Himalaya Gentle Baby Wipes', -5, -501, 190, 'Pack of 72 wipes', 'photo-1604917877934-07d8d248d396', 'Alcohol-free aloe and lotus wipes for gentle baby cleansing.', 160),
  product(44, 'Sebamed Baby Cleansing Bar', -5, -502, 235, 'Bar of 100 g', 'photo-1556229010-6c3f2c9ca5f8', 'Soap-free pH 5.5 extra mild cleansing bar for delicate baby skin.', 199),
  product(45, 'Johnsons Baby Daily Moisture Lotion', -5, -502, 195, 'Bottle of 200 ml', 'photo-1604917877934-07d8d248d396', 'Gentle coconut oil baby moisturizer for 24-hour hydration.', 169),
  product(46, 'Philips Avent Anti-Colic Feeding Bottle', -5, -503, 495, 'Bottle of 260 ml', 'photo-1516627145497-ae6968895b74', 'Clinically proven anti-colic feeding bottle with silicone teat.', 425),
  product(47, 'Mee Mee Soft Textured Silicone Teether', -5, -503, 149, '1 unit', 'photo-1516627145497-ae6968895b74', 'BPA-free soothing chew teether for teething infants.', 125),
  product(48, 'Woodwards Gripe Water', -5, -504, 75, 'Bottle of 130 ml', 'photo-1584308666744-24d5c474f2ae', 'Traditional ayurvedic formulation for infant colic and stomach aches.', 65),
  product(49, 'Himalaya Baby Diaper Rash Cream', -5, -504, 125, 'Tube of 50 g', 'photo-1556229010-6c3f2c9ca5f8', 'Zinc oxide and almond oil cream to heal and soothe diaper rash.', 105),
  product(50, 'Mothers Horlicks Nutrition Drink', -5, -505, 420, 'Jar of 400 g', 'photo-1544005313-94ddf0286df2', 'Specialised micronutrient formulation for pregnancy and lactation.', 375),
  product(51, 'Bio-Oil Specialist Skincare Oil', -5, -505, 495, 'Bottle of 60 ml', 'photo-1544005313-94ddf0286df2', 'PurCellin oil for stretch marks, scars, and uneven skin tone.', 445),

  // Category -6: Ayurvedic Herbal Care
  product(52, 'Dabur Chyawanprash Immunity Booster', -6, -601, 395, 'Jar of 1 kg', 'photo-1617791160505-6f00b51616ec', 'Classic 40+ herb ayurvedic immunity blend with amla and honey.', 345),
  product(53, 'Baidyanath Chyawanprash Special', -6, -601, 380, 'Jar of 1 kg', 'photo-1617791160505-6f00b51616ec', 'Enriched with silver, saffron, and natural vitamin C herbs.', 335),
  product(54, 'Kapiva Wild Amla Juice', -6, -602, 299, 'Bottle of 1 L', 'photo-1540420773420-3366772f4999', 'Cold-pressed wild Pratapgarh amla juice for digestion and skin.', 249),
  product(55, 'Baidyanath Aloe Vera Juice', -6, -602, 260, 'Bottle of 1 L', 'photo-1540420773420-3366772f4999', 'Fiber-rich aloe barbadensis juice for detox and metabolism.', 220),
  product(56, 'Dr. Ortho Ayurvedic Pain Relief Oil', -6, -603, 295, 'Bottle of 120 ml', 'photo-1608248543803-ba4f8c70ae0b', 'Traditional 8 herbal oils formula for joint, knee and muscle relief.', 255),
  product(57, 'Zandu Ortho Vedic Knee & Joint Oil', -6, -603, 310, 'Bottle of 100 ml', 'photo-1608248543803-ba4f8c70ae0b', 'Fast penetrating herbal liniment for chronic joint aches.', 270),
  product(58, 'Himalaya Ashwagandha Tablets', -6, -604, 185, 'Bottle of 60 tablets', 'photo-1512069772995-ec65ed45afd6', 'Pure herb extract for stress relief, vitality, and restful sleep.', 160),
  product(59, 'Organic India Tulsi Holy Basil Capsules', -6, -604, 235, 'Bottle of 60 capsules', 'photo-1512069772995-ec65ed45afd6', 'Blend of Rama, Krishna, and Vana Tulsi for respiratory wellness.', 205),
  product(60, 'Dabur Pudin Hara Active Pearls', -6, -605, 35, 'Strip of 10 pearls', 'photo-1546069901-ba9599a7e63c', 'Natural peppermint oil formulation for instant relief from gas.', 30),
  product(61, 'Baidyanath Triphala Churna', -6, -605, 115, 'Pack of 200 g', 'photo-1546069901-ba9599a7e63c', 'Amla, Haritaki and Bibhitaki herbal digestive balancer.', 99),

  // Category -7: Homeopath Care
  product(62, 'SBL Arnica Montana 30 CH', -7, -701, 105, 'Bottle of 30 ml', 'photo-1584308666744-24d5c474f2ae', 'Homeopathic dilution for bruises, blunt injuries, and muscle soreness.', 90),
  product(63, 'Dr. Reckeweg Belladonna 30 CH', -7, -701, 175, 'Bottle of 11 ml', 'photo-1584308666744-24d5c474f2ae', 'German homeopathic dilution for sudden fever, flush, and sore throat.', 155),
  product(64, 'Schwabe Berberis Aquifolium Mother Tincture Q', -7, -702, 210, 'Bottle of 30 ml', 'photo-1512069772995-ec65ed45afd6', 'Mother tincture for skin complexion, blemishes and acne scars.', 185),
  product(65, 'SBL Calendula Officinalis Mother Tincture Q', -7, -702, 125, 'Bottle of 30 ml', 'photo-1512069772995-ec65ed45afd6', 'Antiseptic healing tincture for external cuts, wounds and burns.', 110),
  product(66, 'SBL Biochemic Calcarea Phosphorica 6X', -7, -703, 115, 'Pack of 25 g', 'photo-1584017911766-d451b3d0e843', 'Tissue salt for calcium absorption, bone strength, and dentition.', 100),
  product(67, 'Dr. Reckeweg Five Phos 6X Tablets', -7, -703, 195, 'Pack of 20 g', 'photo-1584017911766-d451b3d0e843', 'Biochemic nerve tonic for mental fatigue, exhaustion and recovery.', 175),
  product(68, 'SBL Alfalfa Tonic with Ginseng', -7, -704, 145, 'Bottle of 180 ml', 'photo-1550572017-edd951b55104', 'Natural appetite stimulant, stamina booster and general health tonic.', 125),
  product(69, 'Dr. Reckeweg R1 Drops (Inflammation)', -7, -704, 270, 'Bottle of 22 ml', 'photo-1550572017-edd951b55104', 'German homeopathic drops for localized inflammatory affections.', 240),
  product(70, 'SBL Cantharis Ointment', -7, -705, 75, 'Tube of 25 g', 'photo-1608248543803-ba4f8c70ae0b', 'Topical homeopathic ointment for burns, scalds, and blistering.', 65),
  product(71, 'Schwabe Topi Heal Cream', -7, -705, 110, 'Tube of 25 g', 'photo-1608248543803-ba4f8c70ae0b', 'Gentle homeopathic cream for skin healing and minor wounds.', 95),
];

export const DEMO_BANNERS = [
  { id: -1, title: 'Everyday health, made easier.', subtitle: 'Explore medicines, OTC, personal care & diagnostics.', action_text: 'EXPLORE CATEGORIES' },
  { id: -2, title: 'Ayurvedic & Homeopath Care', subtitle: 'Natural herbal wellness, tinctures & classic tonics.', action_text: 'SHOP HERBAL' },
];

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
