-- =============================================================================
--  seed-inventory.sql  — Populate test stock items across all categories
--  Database: PostgreSQL  |  Tables: public."StockItems", public."StockTransactions"
--
--  Run against your UtanoDb:
--    psql -U postgres -d UtanoDb -f seed-inventory.sql
--
--  The script picks the first Practice it finds. If you have multiple practices
--  set the practice_id variable manually at the top of the DO block.
-- =============================================================================

DO $$
DECLARE
    practice_id  UUID;
    now_ts       TIMESTAMPTZ := NOW();

    -- stock item ids
    id_med_001 UUID := gen_random_uuid();
    id_med_002 UUID := gen_random_uuid();
    id_med_003 UUID := gen_random_uuid();
    id_med_004 UUID := gen_random_uuid();
    id_med_005 UUID := gen_random_uuid();
    id_med_006 UUID := gen_random_uuid();
    id_med_007 UUID := gen_random_uuid();
    id_med_008 UUID := gen_random_uuid();

    id_con_001 UUID := gen_random_uuid();
    id_con_002 UUID := gen_random_uuid();
    id_con_003 UUID := gen_random_uuid();
    id_con_004 UUID := gen_random_uuid();
    id_con_005 UUID := gen_random_uuid();
    id_con_006 UUID := gen_random_uuid();
    id_con_007 UUID := gen_random_uuid();
    id_con_008 UUID := gen_random_uuid();
    id_con_009 UUID := gen_random_uuid();

    id_eqp_001 UUID := gen_random_uuid();
    id_eqp_002 UUID := gen_random_uuid();
    id_eqp_003 UUID := gen_random_uuid();
    id_eqp_004 UUID := gen_random_uuid();
    id_eqp_005 UUID := gen_random_uuid();
    id_eqp_006 UUID := gen_random_uuid();

    id_lab_001 UUID := gen_random_uuid();
    id_lab_002 UUID := gen_random_uuid();
    id_lab_003 UUID := gen_random_uuid();
    id_lab_004 UUID := gen_random_uuid();
    id_lab_005 UUID := gen_random_uuid();
    id_lab_006 UUID := gen_random_uuid();
    id_lab_007 UUID := gen_random_uuid();

    id_oth_001 UUID := gen_random_uuid();
    id_oth_002 UUID := gen_random_uuid();
    id_oth_003 UUID := gen_random_uuid();
    id_oth_004 UUID := gen_random_uuid();
    id_oth_005 UUID := gen_random_uuid();

BEGIN
    -- resolve practice
    SELECT "Id" INTO practice_id FROM "Practices" LIMIT 1;
    IF practice_id IS NULL THEN
        RAISE EXCEPTION 'No practice found in the database. Run the app setup first.';
    END IF;

    RAISE NOTICE 'Seeding inventory for practice %', practice_id;

    -- =========================================================================
    --  STOCK ITEMS
    -- =========================================================================

    INSERT INTO "StockItems"
        ("Id","PracticeId","Name","Sku","Description","Category","Unit",
         "SellingPrice","CostPrice","QuantityOnHand","ReorderLevel","IsActive","CreatedAt","UpdatedAt")
    VALUES

    -- ── Medication ────────────────────────────────────────────────────────────
    (id_med_001, practice_id, 'Amoxicillin 500mg Capsules',  'MED-001', 'Broad-spectrum antibiotic',             'Medication',  'Capsules',  2.50,   1.20,  200, 100, TRUE, now_ts, now_ts),
    (id_med_002, practice_id, 'Metformin 850mg Tablets',     'MED-002', 'Oral antidiabetic',                     'Medication',  'Tablets',   1.80,   0.80,  200, 200, TRUE, now_ts, now_ts),
    (id_med_003, practice_id, 'Amlodipine 5mg Tablets',      'MED-003', 'Calcium channel blocker, hypertension', 'Medication',  'Tablets',   3.20,   1.50,  200, 150, TRUE, now_ts, now_ts),
    (id_med_004, practice_id, 'Paracetamol 500mg Tablets',   'MED-004', 'Analgesic and antipyretic',             'Medication',  'Tablets',   0.50,   0.20,  500, 500, TRUE, now_ts, now_ts),
    (id_med_005, practice_id, 'Omeprazole 20mg Capsules',    'MED-005', 'Proton pump inhibitor',                 'Medication',  'Capsules',  4.00,   1.80,  200, 100, TRUE, now_ts, now_ts),
    (id_med_006, practice_id, 'Atorvastatin 20mg Tablets',   'MED-006', 'Cholesterol-lowering statin',           'Medication',  'Tablets',   5.50,   2.50,  200, 100, TRUE, now_ts, now_ts),
    (id_med_007, practice_id, 'Salbutamol Inhaler 100mcg',   'MED-007', 'Bronchodilator for asthma',             'Medication',  'Inhaler',  18.00,   9.00,   30,  30, TRUE, now_ts, now_ts),
    (id_med_008, practice_id, 'Ibuprofen 400mg Tablets',     'MED-008', 'NSAID anti-inflammatory',               'Medication',  'Tablets',   0.80,   0.35,  300, 300, TRUE, now_ts, now_ts),

    -- ── Consumable ───────────────────────────────────────────────────────────
    (id_con_001, practice_id, 'Disposable Gloves Large',     'CON-001', '100 per box, latex-free',               'Consumable',  'Box',       12.00,   7.00,   50,  20, TRUE, now_ts, now_ts),
    (id_con_002, practice_id, 'Disposable Gloves Medium',    'CON-002', '100 per box, latex-free',               'Consumable',  'Box',       12.00,   7.00,   50,  20, TRUE, now_ts, now_ts),
    (id_con_003, practice_id, '3-Ply Surgical Masks',        'CON-003', '50 per box',                            'Consumable',  'Box',        8.00,   4.00,   50,  30, TRUE, now_ts, now_ts),
    (id_con_004, practice_id, 'Sterile Gauze Swabs 10x10cm', 'CON-004', 'Non-woven sterile, pack of 10',         'Consumable',  'Pack',       6.50,   3.00,   50,  50, TRUE, now_ts, now_ts),
    (id_con_005, practice_id, 'Adhesive Plasters Assorted',  'CON-005', '100 per box, waterproof',               'Consumable',  'Box',        5.00,   2.20,   50,  40, TRUE, now_ts, now_ts),
    (id_con_006, practice_id, 'Syringes 5ml with Needle',    'CON-006', '100 per box, sterile single-use',       'Consumable',  'Box',       15.00,   7.50,   50,  25, TRUE, now_ts, now_ts),
    (id_con_007, practice_id, 'IV Cannula 20G',              'CON-007', 'Intravenous catheter, single-use',      'Consumable',  'Each',       3.50,   1.80,   50,  60, TRUE, now_ts, now_ts),
    (id_con_008, practice_id, 'Cotton Wool Balls',           'CON-008', 'Pack of 200 sterile cotton balls',      'Consumable',  'Pack',       2.00,   0.90,   50,  80, TRUE, now_ts, now_ts),
    (id_con_009, practice_id, 'Alcohol Swabs 70%',           'CON-009', '100 individually wrapped',              'Consumable',  'Box',        4.50,   2.00,   50,  50, TRUE, now_ts, now_ts),

    -- ── Equipment ─────────────────────────────────────────────────────────────
    (id_eqp_001, practice_id, 'Digital Thermometer',         'EQP-001', 'Oral/axillary, fast read',              'Equipment',   'Each',      85.00,  45.00,    5,   3, TRUE, now_ts, now_ts),
    (id_eqp_002, practice_id, 'Blood Pressure Cuff Adult',   'EQP-002', 'Manual aneroid sphygmomanometer',       'Equipment',   'Each',     220.00, 120.00,    5,   2, TRUE, now_ts, now_ts),
    (id_eqp_003, practice_id, 'Stethoscope',                 'EQP-003', 'Dual head, cardiology grade',           'Equipment',   'Each',     350.00, 180.00,    5,   2, TRUE, now_ts, now_ts),
    (id_eqp_004, practice_id, 'Pulse Oximeter',              'EQP-004', 'Fingertip SpO2 and pulse rate',         'Equipment',   'Each',     150.00,  80.00,    5,   3, TRUE, now_ts, now_ts),
    (id_eqp_005, practice_id, 'Peak Flow Meter',             'EQP-005', 'For asthma monitoring',                 'Equipment',   'Each',      95.00,  50.00,    5,   3, TRUE, now_ts, now_ts),
    (id_eqp_006, practice_id, 'Otoscope',                    'EQP-006', 'Diagnostic ear examination instrument', 'Equipment',   'Each',     480.00, 260.00,    5,   2, TRUE, now_ts, now_ts),

    -- ── Laboratory ───────────────────────────────────────────────────────────
    (id_lab_001, practice_id, 'Urine Dipstick Strips',       'LAB-001', '100 strips, 10-parameter',              'Laboratory',  'Box',       35.00,  18.00,   30,  10, TRUE, now_ts, now_ts),
    (id_lab_002, practice_id, 'Blood Glucose Test Strips',   'LAB-002', '50 strips, Accu-Chek compatible',       'Laboratory',  'Box',       55.00,  30.00,   30,  10, TRUE, now_ts, now_ts),
    (id_lab_003, practice_id, 'Rapid HIV Test Kits',         'LAB-003', '25 tests per box, whole blood',         'Laboratory',  'Box',      120.00,  65.00,   30,   5, TRUE, now_ts, now_ts),
    (id_lab_004, practice_id, 'Malaria RDT Kits',            'LAB-004', '25 tests, P. falciparum/pan',           'Laboratory',  'Box',       90.00,  50.00,   30,   5, TRUE, now_ts, now_ts),
    (id_lab_005, practice_id, 'Pregnancy Test Strips',       'LAB-005', '25 per box, urine hCG',                 'Laboratory',  'Box',       40.00,  20.00,   30,  10, TRUE, now_ts, now_ts),
    (id_lab_006, practice_id, 'EDTA Blood Collection Tubes', 'LAB-006', 'Pack of 50, 3ml vacuum tubes',          'Laboratory',  'Pack',      22.00,  11.00,   30,  20, TRUE, now_ts, now_ts),
    (id_lab_007, practice_id, 'Blood Culture Bottles',       'LAB-007', 'Aerobic, 40ml BacT/Alert',              'Laboratory',  'Each',      18.00,   9.00,   30,  15, TRUE, now_ts, now_ts),

    -- ── Other ─────────────────────────────────────────────────────────────────
    (id_oth_001, practice_id, 'Prescription Pads',           'OTH-001', '50 duplicate sheets per pad',           'Other',       'Pad',       25.00,  12.00,   20,  10, TRUE, now_ts, now_ts),
    (id_oth_002, practice_id, 'Patient Wristbands',          'OTH-002', '100 per box, write-on white',           'Other',       'Box',       15.00,   7.00,   20,  10, TRUE, now_ts, now_ts),
    (id_oth_003, practice_id, 'Hand Sanitiser 500ml',        'OTH-003', '70% alcohol gel',                       'Other',       'Bottle',    22.00,  10.00,   20,  15, TRUE, now_ts, now_ts),
    (id_oth_004, practice_id, 'Sharps Container 5L',         'OTH-004', 'Yellow lid, puncture-resistant',        'Other',       'Each',      18.00,   9.00,   20,  10, TRUE, now_ts, now_ts),
    (id_oth_005, practice_id, 'Medical Waste Bags Red',      'OTH-005', '50 per box, 50L biohazard bags',        'Other',       'Box',       30.00,  15.00,   20,  10, TRUE, now_ts, now_ts);

    -- =========================================================================
    --  OPENING STOCK TRANSACTIONS  (Type = 'Received', QuantityBefore = 0)
    -- =========================================================================

    INSERT INTO "StockTransactions"
        ("Id","PracticeId","StockItemId","StockItemName","Type",
         "Quantity","QuantityBefore","QuantityAfter","UnitCost",
         "Notes","ReferenceType","ReferenceId","CreatedAt")
    VALUES

    -- Medication
    (gen_random_uuid(), practice_id, id_med_001, 'Amoxicillin 500mg Capsules',  'Received', 200,0,200, 1.20, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_002, 'Metformin 850mg Tablets',     'Received', 200,0,200, 0.80, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_003, 'Amlodipine 5mg Tablets',      'Received', 200,0,200, 1.50, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_004, 'Paracetamol 500mg Tablets',   'Received', 500,0,500, 0.20, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_005, 'Omeprazole 20mg Capsules',    'Received', 200,0,200, 1.80, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_006, 'Atorvastatin 20mg Tablets',   'Received', 200,0,200, 2.50, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_007, 'Salbutamol Inhaler 100mcg',   'Received',  30,0, 30, 9.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_med_008, 'Ibuprofen 400mg Tablets',     'Received', 300,0,300, 0.35, 'Opening stock — seed script', 'Manual', NULL, now_ts),

    -- Consumable
    (gen_random_uuid(), practice_id, id_con_001, 'Disposable Gloves Large',     'Received',  50,0, 50, 7.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_002, 'Disposable Gloves Medium',    'Received',  50,0, 50, 7.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_003, '3-Ply Surgical Masks',        'Received',  50,0, 50, 4.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_004, 'Sterile Gauze Swabs 10x10cm', 'Received',  50,0, 50, 3.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_005, 'Adhesive Plasters Assorted',  'Received',  50,0, 50, 2.20, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_006, 'Syringes 5ml with Needle',    'Received',  50,0, 50, 7.50, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_007, 'IV Cannula 20G',              'Received',  50,0, 50, 1.80, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_008, 'Cotton Wool Balls',           'Received',  50,0, 50, 0.90, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_con_009, 'Alcohol Swabs 70%',           'Received',  50,0, 50, 2.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),

    -- Equipment
    (gen_random_uuid(), practice_id, id_eqp_001, 'Digital Thermometer',         'Received',   5,0,  5,45.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_eqp_002, 'Blood Pressure Cuff Adult',   'Received',   5,0,  5,120.00,'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_eqp_003, 'Stethoscope',                 'Received',   5,0,  5,180.00,'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_eqp_004, 'Pulse Oximeter',              'Received',   5,0,  5, 80.00,'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_eqp_005, 'Peak Flow Meter',             'Received',   5,0,  5, 50.00,'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_eqp_006, 'Otoscope',                    'Received',   5,0,  5,260.00,'Opening stock — seed script', 'Manual', NULL, now_ts),

    -- Laboratory
    (gen_random_uuid(), practice_id, id_lab_001, 'Urine Dipstick Strips',       'Received',  30,0, 30,18.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_002, 'Blood Glucose Test Strips',   'Received',  30,0, 30,30.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_003, 'Rapid HIV Test Kits',         'Received',  30,0, 30,65.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_004, 'Malaria RDT Kits',            'Received',  30,0, 30,50.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_005, 'Pregnancy Test Strips',       'Received',  30,0, 30,20.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_006, 'EDTA Blood Collection Tubes', 'Received',  30,0, 30,11.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_lab_007, 'Blood Culture Bottles',       'Received',  30,0, 30, 9.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),

    -- Other
    (gen_random_uuid(), practice_id, id_oth_001, 'Prescription Pads',           'Received',  20,0, 20,12.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_oth_002, 'Patient Wristbands',          'Received',  20,0, 20, 7.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_oth_003, 'Hand Sanitiser 500ml',        'Received',  20,0, 20,10.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_oth_004, 'Sharps Container 5L',         'Received',  20,0, 20, 9.00, 'Opening stock — seed script', 'Manual', NULL, now_ts),
    (gen_random_uuid(), practice_id, id_oth_005, 'Medical Waste Bags Red',      'Received',  20,0, 20,15.00, 'Opening stock — seed script', 'Manual', NULL, now_ts);

    RAISE NOTICE 'Done — 35 stock items and 35 opening transactions inserted.';
END $$;
