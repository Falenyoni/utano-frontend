# =============================================================================
#  seed-inventory.ps1  — Populate test inventory across all stock categories
#
#  Usage:
#    .\seed-inventory.ps1 -Email admin@clinic.com -Password yourpassword
#    .\seed-inventory.ps1 -Email admin@clinic.com -Password yourpassword -BaseUrl http://localhost:5001
# =============================================================================

param(
    [Parameter(Mandatory)] [string] $Email,
    [Parameter(Mandatory)] [string] $Password,
    [string] $BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Stop"

# ─── 1. Login ─────────────────────────────────────────────────────────────────

Write-Host "`nLogging in as $Email..." -ForegroundColor Cyan

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = $loginResp.accessToken
if (-not $token) { Write-Error "Login failed — no accessToken in response"; exit 1 }

Write-Host "Login OK" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# ─── 2. Stock items ────────────────────────────────────────────────────────────

$items = @(

    # ── Medication ──────────────────────────────────────────────────────────────
    @{ name="Amoxicillin 500mg Capsules";   sku="MED-001"; category="Medication";  unit="Capsules"; sellingPrice=2.50;  costPrice=1.20; reorderLevel=100; description="Broad-spectrum antibiotic" }
    @{ name="Metformin 850mg Tablets";       sku="MED-002"; category="Medication";  unit="Tablets";  sellingPrice=1.80;  costPrice=0.80; reorderLevel=200; description="Oral antidiabetic" }
    @{ name="Amlodipine 5mg Tablets";        sku="MED-003"; category="Medication";  unit="Tablets";  sellingPrice=3.20;  costPrice=1.50; reorderLevel=150; description="Calcium channel blocker for hypertension" }
    @{ name="Paracetamol 500mg Tablets";     sku="MED-004"; category="Medication";  unit="Tablets";  sellingPrice=0.50;  costPrice=0.20; reorderLevel=500; description="Analgesic and antipyretic" }
    @{ name="Omeprazole 20mg Capsules";      sku="MED-005"; category="Medication";  unit="Capsules"; sellingPrice=4.00;  costPrice=1.80; reorderLevel=100; description="Proton pump inhibitor" }
    @{ name="Atorvastatin 20mg Tablets";     sku="MED-006"; category="Medication";  unit="Tablets";  sellingPrice=5.50;  costPrice=2.50; reorderLevel=100; description="Cholesterol-lowering statin" }
    @{ name="Salbutamol Inhaler 100mcg";     sku="MED-007"; category="Medication";  unit="Inhaler";  sellingPrice=18.00; costPrice=9.00; reorderLevel=30;  description="Bronchodilator for asthma" }
    @{ name="Ibuprofen 400mg Tablets";       sku="MED-008"; category="Medication";  unit="Tablets";  sellingPrice=0.80;  costPrice=0.35; reorderLevel=300; description="NSAID anti-inflammatory" }

    # ── Consumable ──────────────────────────────────────────────────────────────
    @{ name="Disposable Gloves (Large)";     sku="CON-001"; category="Consumable";  unit="Box";      sellingPrice=12.00; costPrice=7.00; reorderLevel=20;  description="100 gloves per box, latex-free" }
    @{ name="Disposable Gloves (Medium)";    sku="CON-002"; category="Consumable";  unit="Box";      sellingPrice=12.00; costPrice=7.00; reorderLevel=20;  description="100 gloves per box, latex-free" }
    @{ name="3-Ply Surgical Masks";          sku="CON-003"; category="Consumable";  unit="Box";      sellingPrice=8.00;  costPrice=4.00; reorderLevel=30;  description="50 masks per box" }
    @{ name="Sterile Gauze Swabs 10x10cm";   sku="CON-004"; category="Consumable";  unit="Pack";     sellingPrice=6.50;  costPrice=3.00; reorderLevel=50;  description="Non-woven sterile swabs, pack of 10" }
    @{ name="Adhesive Plasters Assorted";    sku="CON-005"; category="Consumable";  unit="Box";      sellingPrice=5.00;  costPrice=2.20; reorderLevel=40;  description="100 per box, waterproof" }
    @{ name="Syringes 5ml with Needle";      sku="CON-006"; category="Consumable";  unit="Box";      sellingPrice=15.00; costPrice=7.50; reorderLevel=25;  description="100 per box, sterile single-use" }
    @{ name="IV Cannula 20G";                sku="CON-007"; category="Consumable";  unit="Each";     sellingPrice=3.50;  costPrice=1.80; reorderLevel=60;  description="Intravenous catheter, single-use" }
    @{ name="Cotton Wool Balls";             sku="CON-008"; category="Consumable";  unit="Pack";     sellingPrice=2.00;  costPrice=0.90; reorderLevel=80;  description="Pack of 200 sterile cotton balls" }
    @{ name="Alcohol Swabs 70%";             sku="CON-009"; category="Consumable";  unit="Box";      sellingPrice=4.50;  costPrice=2.00; reorderLevel=50;  description="100 individually wrapped swabs" }

    # ── Equipment ───────────────────────────────────────────────────────────────
    @{ name="Digital Thermometer";           sku="EQP-001"; category="Equipment";   unit="Each";     sellingPrice=85.00;  costPrice=45.00; reorderLevel=3; description="Oral/axillary, fast read" }
    @{ name="Blood Pressure Cuff (Adult)";   sku="EQP-002"; category="Equipment";   unit="Each";     sellingPrice=220.00; costPrice=120.00; reorderLevel=2; description="Manual aneroid sphygmomanometer" }
    @{ name="Stethoscope";                   sku="EQP-003"; category="Equipment";   unit="Each";     sellingPrice=350.00; costPrice=180.00; reorderLevel=2; description="Dual head, cardiology grade" }
    @{ name="Pulse Oximeter";                sku="EQP-004"; category="Equipment";   unit="Each";     sellingPrice=150.00; costPrice=80.00;  reorderLevel=3; description="Fingertip SpO2 and pulse rate" }
    @{ name="Peak Flow Meter";               sku="EQP-005"; category="Equipment";   unit="Each";     sellingPrice=95.00;  costPrice=50.00;  reorderLevel=3; description="For asthma monitoring" }
    @{ name="Otoscope";                      sku="EQP-006"; category="Equipment";   unit="Each";     sellingPrice=480.00; costPrice=260.00; reorderLevel=2; description="Diagnostic ear examination instrument" }

    # ── Laboratory ──────────────────────────────────────────────────────────────
    @{ name="Urine Dipstick Strips";         sku="LAB-001"; category="Laboratory";  unit="Box";      sellingPrice=35.00;  costPrice=18.00; reorderLevel=10; description="100 strips, 10-parameter" }
    @{ name="Blood Glucose Test Strips";     sku="LAB-002"; category="Laboratory";  unit="Box";      sellingPrice=55.00;  costPrice=30.00; reorderLevel=10; description="50 strips, compatible with Accu-Chek" }
    @{ name="Rapid HIV Test Kits";           sku="LAB-003"; category="Laboratory";  unit="Box";      sellingPrice=120.00; costPrice=65.00; reorderLevel=5;  description="25 tests per box, whole blood" }
    @{ name="Malaria RDT Kits";             sku="LAB-004"; category="Laboratory";  unit="Box";      sellingPrice=90.00;  costPrice=50.00; reorderLevel=5;  description="25 tests, P. falciparum/pan" }
    @{ name="Pregnancy Test Strips";         sku="LAB-005"; category="Laboratory";  unit="Box";      sellingPrice=40.00;  costPrice=20.00; reorderLevel=10; description="25 per box, urine hCG" }
    @{ name="EDTA Blood Collection Tubes";   sku="LAB-006"; category="Laboratory";  unit="Pack";     sellingPrice=22.00;  costPrice=11.00; reorderLevel=20; description="Pack of 50, 3ml vacuum tubes" }
    @{ name="Blood Culture Bottles";         sku="LAB-007"; category="Laboratory";  unit="Each";     sellingPrice=18.00;  costPrice=9.00;  reorderLevel=15; description="Aerobic, 40ml BacT/Alert" }

    # ── Other ────────────────────────────────────────────────────────────────────
    @{ name="Prescription Pads";             sku="OTH-001"; category="Other";       unit="Pad";      sellingPrice=25.00;  costPrice=12.00; reorderLevel=10; description="50 duplicate sheets per pad" }
    @{ name="Patient Wristbands";            sku="OTH-002"; category="Other";       unit="Box";      sellingPrice=15.00;  costPrice=7.00;  reorderLevel=10; description="100 per box, write-on white" }
    @{ name="Hand Sanitiser 500ml";          sku="OTH-003"; category="Other";       unit="Bottle";   sellingPrice=22.00;  costPrice=10.00; reorderLevel=15; description="70% alcohol gel" }
    @{ name="Sharps Container 5L";           sku="OTH-004"; category="Other";       unit="Each";     sellingPrice=18.00;  costPrice=9.00;  reorderLevel=10; description="Yellow lid, puncture-resistant" }
    @{ name="Medical Waste Bags (Red)";      sku="OTH-005"; category="Other";       unit="Box";      sellingPrice=30.00;  costPrice=15.00; reorderLevel=10; description="50 per box, 50L biohazard bags" }
)

# ─── 3. POST each item ────────────────────────────────────────────────────────

$ok    = 0
$fail  = 0
$total = $items.Count

Write-Host "`nSeeding $total stock items...`n" -ForegroundColor Cyan

foreach ($item in $items) {
    $body = $item | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri "$BaseUrl/api/inventory/stock" `
            -Method POST `
            -Headers $headers `
            -Body $body
        Write-Host "  [OK]   $($item.category.PadRight(12)) $($item.name)" -ForegroundColor Green
        $ok++
    } catch {
        $msg = $_.Exception.Message
        Write-Host "  [FAIL] $($item.category.PadRight(12)) $($item.name) — $msg" -ForegroundColor Red
        $fail++
    }
}

# ─── 4. Receive initial stock ─────────────────────────────────────────────────
# Fetch created items and give each one a starting quantity so the inventory
# isn't sitting at zero straight away.

Write-Host "`nFetching created items to set initial stock quantities..." -ForegroundColor Cyan

$stockResp = Invoke-RestMethod -Uri "$BaseUrl/api/inventory/stock?pageSize=100&activeOnly=true" `
    -Method GET `
    -Headers $headers

$defaultQty = @{
    Medication  = 200
    Consumable  = 50
    Equipment   = 5
    Laboratory  = 30
    Other       = 20
}

foreach ($s in $stockResp.data) {
    $qty = if ($defaultQty.ContainsKey($s.category)) { $defaultQty[$s.category] } else { 20 }
    $receiveBody = @{ quantity = $qty; unitCost = $null; notes = "Opening stock — seed script" } | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri "$BaseUrl/api/inventory/stock/$($s.id)/receive" `
            -Method POST `
            -Headers $headers `
            -Body $receiveBody
        Write-Host "  [STOCK] $($s.name) += $qty" -ForegroundColor DarkCyan
    } catch {
        Write-Host "  [SKIP]  Could not receive stock for $($s.name)" -ForegroundColor Yellow
    }
}

# ─── 5. Summary ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Done. $ok created, $fail failed." -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
