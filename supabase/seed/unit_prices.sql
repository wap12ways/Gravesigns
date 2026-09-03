-- ─────────────────────────────────────────────────────────────────────────────
-- PLACEHOLDER unit prices — Portland/Beaverton metro, commercial and public work.
--
-- Covers both halves of Alpha's business: remediation (asbestos, mold, radon,
-- tanks, sewer) and the testing/consulting side (surveys, sampling, air
-- monitoring, reports), plus lead. Demolition is NOT here — Alpha's real
-- demolition rates live in unit_prices_alpha_actual.sql, taken from their own
-- Metro bid, and are worth far more than anything invented.
--
-- EVERY ROW IS A PLACEHOLDER. The numbers are plausible 2026 Portland-market
-- figures assembled for testing the estimator, NOT Alpha's real rates. Replace
-- them from /cost-library (edit in place, or CSV import) before quoting anything.
--
-- unit_cost  = what the work costs Alpha (labour + material + disposal)
-- unit_price = what it sells for before project markup and contingency
--
-- Re-runnable: on conflict it refreshes the placeholder rows but leaves any
-- real rate you have already typed in untouched (see the WHERE clause).
-- ─────────────────────────────────────────────────────────────────────────────

insert into unit_prices (category, item_code, description, unit, unit_cost, unit_price, notes) values
-- ── asbestos ────────────────────────────────────────────────────────────────
('asbestos','ASB-FLR-VAT','Remove 9x9/12x12 vinyl asbestos tile and mastic, Class II','sf',3.25,4.75,'PLACEHOLDER'),
('asbestos','ASB-FLR-SHEET','Remove sheet vinyl flooring with asbestos felt backing','sf',4.50,6.50,'PLACEHOLDER'),
('asbestos','ASB-MASTIC','Remove black cutback mastic only (flooring already gone)','sf',2.10,3.10,'PLACEHOLDER'),
('asbestos','ASB-TSI-SM','Remove thermal system insulation, pipe under 6 in. dia.','lf',22.00,32.00,'PLACEHOLDER'),
('asbestos','ASB-TSI-LG','Remove thermal system insulation, pipe 6 in. dia. and larger','lf',34.00,49.00,'PLACEHOLDER'),
('asbestos','ASB-TSI-FIT','Remove insulated pipe fitting, elbow or valve','ea',55.00,80.00,'PLACEHOLDER'),
('asbestos','ASB-DUCT','Remove asbestos duct wrap / duct insulation','sf',6.50,9.50,'PLACEHOLDER'),
('asbestos','ASB-BOILER','Remove boiler, breeching or tank insulation','sf',12.00,17.50,'PLACEHOLDER'),
('asbestos','ASB-TEXTURE','Remove acoustic ceiling texture (popcorn) with substrate','sf',4.25,6.25,'PLACEHOLDER'),
('asbestos','ASB-DRYWALL','Remove drywall system with asbestos joint compound','sf',5.50,8.00,'PLACEHOLDER'),
('asbestos','ASB-CEIL-TILE','Remove asbestos-containing ceiling tile','sf',2.40,3.50,'PLACEHOLDER'),
('asbestos','ASB-ROOF','Remove built-up asbestos roofing and flashing','sf',5.00,7.25,'PLACEHOLDER'),
('asbestos','ASB-SIDING','Remove transite siding, panel or wallboard','sf',4.75,6.95,'PLACEHOLDER'),
('asbestos','ASB-GLAZING','Remove asbestos window glazing and caulk','lf',9.50,14.00,'PLACEHOLDER'),
('asbestos','ASB-FIREDOOR','Remove and dispose asbestos-core fire door','ea',165.00,240.00,'PLACEHOLDER'),
('asbestos','ASB-CONTAIN','Full negative-pressure containment, build and teardown','sf',2.75,4.00,'PLACEHOLDER — priced per sf of floor inside containment'),
('asbestos','ASB-GLOVEBAG','Glovebag setup and removal, per bag','ea',85.00,125.00,'PLACEHOLDER'),
('asbestos','ASB-DECON','Three-stage decontamination unit, setup and teardown','ea',950.00,1400.00,'PLACEHOLDER'),
('asbestos','ASB-DISP-CY','Asbestos waste disposal, bagged and manifested','cy',165.00,240.00,'PLACEHOLDER — Hillsboro/Arlington landfill rates'),
('asbestos','ASB-DISP-DRUM','Asbestos waste disposal, 55 gal drum','ea',145.00,210.00,'PLACEHOLDER'),
('asbestos','ASB-SUPER','Licensed asbestos supervisor','hr',78.00,112.00,'PLACEHOLDER — add GEN-PW-PREM on prevailing wage jobs'),
('asbestos','ASB-WORKER','AHERA-accredited abatement worker','hr',62.00,89.00,'PLACEHOLDER — add GEN-PW-PREM on prevailing wage jobs'),


-- ── lead ────────────────────────────────────────────────────────────────────
-- Alpha does self-perform lead work: FAA contract 697DCK25P00065, June 2025,
-- $78,095 for exterior lead paint abatement at the Burns VOR site. These rates
-- are still placeholders — the FAA award is a lump sum, not a unit schedule.
('lead','LEAD-CHEM','Lead paint removal, chemical stripping','sf',9.50,13.75,'PLACEHOLDER'),
('lead','LEAD-ABRASIVE','Lead paint removal, needle gun / abrasive with HEPA','sf',11.00,16.00,'PLACEHOLDER'),
('lead','LEAD-ENCAP','Apply lead encapsulant coating','sf',2.25,3.30,'PLACEHOLDER'),
('lead','LEAD-COMPONENT','Component removal and replacement, lead-painted','sf',6.50,9.50,'PLACEHOLDER'),
('lead','LEAD-SOIL','Excavate and dispose lead-contaminated soil','cy',145.00,210.00,'PLACEHOLDER'),
('lead','LEAD-CLEAR','Lead clearance cleaning, HEPA and wet wipe','sf',1.35,2.00,'PLACEHOLDER'),
('lead','LEAD-DISP','Lead hazardous waste disposal, 55 gal drum','ea',220.00,320.00,'PLACEHOLDER'),
('lead','LEAD-RRP','RRP-compliant containment and setup, per work area','ls',1250.00,1800.00,'PLACEHOLDER'),
('lead','LEAD-WORKER','Lead-certified abatement worker','hr',60.00,86.00,'PLACEHOLDER'),

-- ── mold ────────────────────────────────────────────────────────────────────
('mold','MOLD-HEPA','HEPA vacuum and damp wipe non-porous surfaces','sf',1.85,2.70,'PLACEHOLDER'),
('mold','MOLD-DRYWALL','Remove and dispose mold-affected drywall and insulation','sf',4.25,6.20,'PLACEHOLDER'),
('mold','MOLD-FRAMING','Clean and treat framing, sheathing and subfloor','sf',3.10,4.50,'PLACEHOLDER'),
('mold','MOLD-BLAST','Soda or dry-ice blasting of structural framing','sf',6.75,9.75,'PLACEHOLDER'),
('mold','MOLD-CONTAIN','Mold containment with negative air, build and teardown','sf',2.40,3.50,'PLACEHOLDER'),
('mold','MOLD-ENCAP','Apply antimicrobial encapsulant','sf',1.60,2.35,'PLACEHOLDER'),
('mold','MOLD-AFD','Air filtration device (air scrubber), per unit per day','day',85.00,125.00,'PLACEHOLDER'),
('mold','MOLD-DEHU','Commercial dehumidifier, per unit per day','day',110.00,160.00,'PLACEHOLDER'),
('mold','MOLD-TECH','Remediation technician','hr',58.00,84.00,'PLACEHOLDER'),


-- ── hazmat ──────────────────────────────────────────────────────────────────
('hazmat','HAZ-LAMP','Universal waste fluorescent lamp removal and recycling','ea',3.75,5.50,'PLACEHOLDER'),
('hazmat','HAZ-BALLAST','PCB-containing ballast removal and disposal','ea',22.00,32.00,'PLACEHOLDER'),
('hazmat','HAZ-PCB-EQUIP','PCB-containing transformer or equipment removal','ea',850.00,1250.00,'PLACEHOLDER'),
('hazmat','HAZ-MERCURY','Mercury-containing device removal (thermostat, switch)','ea',45.00,65.00,'PLACEHOLDER'),
('hazmat','HAZ-UST','Underground storage tank decommission and removal','ea',6500.00,9500.00,'PLACEHOLDER — highly site dependent'),
('hazmat','HAZ-TANK-CLEAN','Tank or vessel cleaning and certification','ea',2400.00,3500.00,'PLACEHOLDER'),
('hazmat','HAZ-SOIL','Excavate, profile and dispose contaminated soil','cy',165.00,240.00,'PLACEHOLDER'),
('hazmat','HAZ-LABPACK','Lab pack / hazardous drum characterisation and disposal','ea',385.00,560.00,'PLACEHOLDER'),
('hazmat','HAZ-TECH','40-hr HAZWOPER technician','hr',72.00,104.00,'PLACEHOLDER'),

-- ── radon ───────────────────────────────────────────────────────────────────
('radon','RAD-TEST-SHORT','Short-term radon test, 48-96 hr device, placement and retrieval','ea',95.00,140.00,'PLACEHOLDER'),
('radon','RAD-TEST-LONG','Long-term radon test, 90+ day alpha track device','ea',145.00,210.00,'PLACEHOLDER'),
('radon','RAD-TEST-CONT','Continuous radon monitor placement and report, per device','ea',185.00,270.00,'PLACEHOLDER'),
('radon','RAD-MIT-SSD','Sub-slab depressurization system, first suction point','ea',1450.00,2100.00,'PLACEHOLDER'),
('radon','RAD-MIT-ADD','Sub-slab depressurization, each additional suction point','ea',575.00,840.00,'PLACEHOLDER'),
('radon','RAD-MIT-CRAWL','Crawlspace membrane and sub-membrane depressurization','sf',4.25,6.20,'PLACEHOLDER'),
('radon','RAD-FAN','Radon fan, supply and install with electrical','ea',425.00,620.00,'PLACEHOLDER'),
('radon','RAD-SEAL','Seal slab cracks, joints and penetrations','lf',8.50,12.50,'PLACEHOLDER'),
('radon','RAD-POST','Post-mitigation clearance test and report','ea',165.00,240.00,'PLACEHOLDER'),

-- ── sewer ───────────────────────────────────────────────────────────────────
('sewer','SEW-INSP','Sewer lateral video inspection with written report','ea',285.00,415.00,'PLACEHOLDER'),
('sewer','SEW-LOCATE','Line locating and depth marking','ea',195.00,285.00,'PLACEHOLDER'),
('sewer','SEW-CLEAN','Hydro-jetting and sewer line cleaning','ea',425.00,620.00,'PLACEHOLDER'),
('sewer','SEW-CIPP','Trenchless CIPP lining, cured in place','lf',95.00,138.00,'PLACEHOLDER'),
('sewer','SEW-BURST','Pipe bursting replacement, trenchless','lf',135.00,195.00,'PLACEHOLDER'),
('sewer','SEW-SPOT','Excavated spot repair, single point','ea',2800.00,4050.00,'PLACEHOLDER'),
('sewer','SEW-CLEANOUT','Install exterior cleanout','ea',850.00,1250.00,'PLACEHOLDER'),
('sewer','SEW-RESTORE','Surface restoration after excavation','sf',18.00,26.00,'PLACEHOLDER'),

-- ── storage tanks, septic and soil ──────────────────────────────────────────
('tank','TNK-SCAN','Underground storage tank scan and sweep, GPR and magnetometer','ea',385.00,560.00,'PLACEHOLDER'),
('tank','TNK-DECOM-PLACE','Tank decommissioning in place, clean and fill','ea',2400.00,3500.00,'PLACEHOLDER'),
('tank','TNK-DECOM-REM','Tank decommissioning by removal, up to 1,000 gal','ea',4200.00,6100.00,'PLACEHOLDER'),
('tank','TNK-DECOM-LG','Tank decommissioning by removal, over 1,000 gal','ea',7500.00,10900.00,'PLACEHOLDER'),
('tank','TNK-SOIL-SAMPLE','DEQ-protocol soil sampling with laboratory analysis','ea',650.00,950.00,'PLACEHOLDER'),
('tank','TNK-DEQ-FILE','DEQ file review, reporting and site closure package','ea',1250.00,1800.00,'PLACEHOLDER'),
('tank','TNK-SEPTIC-PUMP','Septic tank pumping and disposal','ea',585.00,850.00,'PLACEHOLDER'),
('tank','TNK-SEPTIC-DECOM','Septic tank decommissioning per county requirements','ea',1650.00,2400.00,'PLACEHOLDER'),

-- ── testing, surveys and monitoring ─────────────────────────────────────────
('testing','TST-ASB-SURVEY','Asbestos survey, limited pre-renovation scope','ea',850.00,1250.00,'PLACEHOLDER'),
('testing','TST-ASB-FULL','Asbestos survey, full building pre-demolition','ea',2400.00,3500.00,'PLACEHOLDER'),
('testing','TST-ASB-BULK','Bulk sample analysis, PLM','ea',32.00,48.00,'PLACEHOLDER'),
('testing','TST-ASB-PCM','Air sample analysis, PCM','ea',45.00,65.00,'PLACEHOLDER'),
('testing','TST-ASB-TEM','Clearance air sample analysis, TEM','ea',145.00,210.00,'PLACEHOLDER'),
('testing','TST-AIR-DAY','Air monitoring technician on site, per day','day',750.00,1090.00,'PLACEHOLDER'),
('testing','TST-CLEAR','Visual clearance inspection and written report','ea',425.00,620.00,'PLACEHOLDER'),
('testing','TST-MOLD-INSP','Mold inspection with moisture mapping and report','ea',495.00,720.00,'PLACEHOLDER'),
('testing','TST-MOLD-SAMPLE','Mold air or surface sample with laboratory analysis','ea',85.00,125.00,'PLACEHOLDER'),
('testing','TST-LEAD-XRF','Lead-based paint XRF inspection, per building','ea',650.00,950.00,'PLACEHOLDER'),
('testing','TST-LEAD-DUST','Lead dust wipe sample with laboratory analysis','ea',55.00,80.00,'PLACEHOLDER'),
('testing','TST-IAQ','Indoor air quality assessment and report','ea',975.00,1400.00,'PLACEHOLDER'),
('testing','TST-REPORT','Report preparation, certification and delivery','ea',385.00,560.00,'PLACEHOLDER'),

-- ── general conditions ──────────────────────────────────────────────────────
('general','GEN-MOB','Mobilization and demobilization','ls',2200.00,3200.00,'PLACEHOLDER'),
('general','GEN-PM','Project manager','hr',95.00,136.00,'PLACEHOLDER'),
('general','GEN-SUPER','Site superintendent','hr',82.00,118.00,'PLACEHOLDER'),
('general','GEN-SURVEY','Pre-abatement survey and bulk sampling','ls',1850.00,2650.00,'PLACEHOLDER'),
('general','GEN-DESIGN','Abatement project design / work plan (third party)','ls',2800.00,4000.00,'PLACEHOLDER'),
('general','GEN-IH-AIR','Independent third-party air monitoring and clearance, per day','day',950.00,1350.00,'PLACEHOLDER — only when the bid requires a monitor independent of the abatement contractor; otherwise use TST-AIR-DAY'),
('general','GEN-PERMIT','DEQ / agency notification and permit fees','ls',425.00,620.00,'PLACEHOLDER'),
('general','GEN-NEG-AIR','Negative air machine, per unit per day','day',95.00,140.00,'PLACEHOLDER'),
('general','GEN-TEMP-POWER','Temporary power, lighting and water','ls',1450.00,2100.00,'PLACEHOLDER'),
('general','GEN-SCAFFOLD','Scaffolding or lift, per day','day',385.00,560.00,'PLACEHOLDER'),
('general','GEN-PW-PREM','Prevailing wage / BOLI premium over base labour rate','hr',18.00,26.00,'PLACEHOLDER — add to every labour line on public works'),
('general','GEN-TRAVEL','Travel and per diem, per crew member per day','day',285.00,415.00,'PLACEHOLDER — outside Portland metro'),
('general','GEN-SITE-SEC','Site security, fencing and signage','ls',1250.00,1800.00,'PLACEHOLDER'),
('general','GEN-MANIFEST','Waste manifesting, profiling and tracking','ls',350.00,510.00,'PLACEHOLDER'),
('general','GEN-CLOSEOUT','Closeout documentation and record drawings','ls',650.00,950.00,'PLACEHOLDER'),
('general','GEN-BOND','Payment and performance bond','ls',0.00,0.00,'PLACEHOLDER — price as a percentage of contract value; set per job')
on conflict (item_code) do update set
  description = excluded.description,
  unit        = excluded.unit,
  unit_cost   = excluded.unit_cost,
  unit_price  = excluded.unit_price,
  notes       = excluded.notes
-- Only refresh rows that are still untouched placeholders. Once someone edits
-- a rate (and drops the PLACEHOLDER note), re-running this seed leaves it be.
where unit_prices.notes like 'PLACEHOLDER%';
