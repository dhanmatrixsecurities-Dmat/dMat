import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Autocomplete,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu, Switch,
} from '@mui/material';
import { Add, Edit, Delete, Close, MoreVert, UploadFile } from '@mui/icons-material';

const NSE_STOCKS = [{"symbol":"20MICRONS","name":"20 Microns Limited"},{"symbol":"360ONE","name":"360 ONE WAM LIMITED"},{"symbol":"5PAISA","name":"5Paisa Capital Limited"},{"symbol":"ABB","name":"ABB India Limited"},{"symbol":"ABBOTINDIA","name":"Abbott India Limited"},{"symbol":"ABCAPITAL","name":"Aditya Birla Capital Limited"},{"symbol":"ABFRL","name":"Aditya Birla Fashion and Retail Limited"},{"symbol":"ACC","name":"ACC Limited"},{"symbol":"ACE","name":"Action Construction Equipment Limited"},{"symbol":"ADANIENSOL","name":"Adani Energy Solutions Limited"},{"symbol":"ADANIENT","name":"Adani Enterprises Limited"},{"symbol":"ADANIGREEN","name":"Adani Green Energy Limited"},{"symbol":"ADANIPORTS","name":"Adani Ports and Special Economic Zone Limited"},{"symbol":"ADANIPOWER","name":"Adani Power Limited"},{"symbol":"ADFFOODS","name":"ADF Foods Limited"},{"symbol":"AEGISLOG","name":"Aegis Logistics Limited"},{"symbol":"AETHER","name":"Aether Industries Limited"},{"symbol":"AFFLE","name":"Affle 3i Limited"},{"symbol":"AJANTPHARM","name":"Ajanta Pharma Limited"},{"symbol":"ALKEM","name":"Alkem Laboratories Limited"},{"symbol":"ALKYLAMINE","name":"Alkyl Amines Chemicals Limited"},{"symbol":"ALLCARGO","name":"Allcargo Logistics Limited"},{"symbol":"ALOKINDS","name":"Alok Industries Limited"},{"symbol":"AMBUJACEM","name":"Ambuja Cements Limited"},{"symbol":"ANANDRATHI","name":"Anand Rathi Wealth Limited"},{"symbol":"ANANTRAJ","name":"Anant Raj Limited"},{"symbol":"ANGELONE","name":"Angel One Limited"},{"symbol":"APOLLOHOSP","name":"Apollo Hospitals Enterprise Limited"},{"symbol":"APOLLOTYRE","name":"Apollo Tyres Limited"},{"symbol":"APTUS","name":"Aptus Value Housing Finance India Limited"},{"symbol":"ASIANPAINT","name":"Asian Paints Limited"},{"symbol":"ASTRAL","name":"Astral Limited"},{"symbol":"ASTRAMICRO","name":"Astra Microwave Products Limited"},{"symbol":"AUBANK","name":"AU Small Finance Bank Limited"},{"symbol":"AUROPHARMA","name":"Aurobindo Pharma Limited"},{"symbol":"AXISBANK","name":"Axis Bank Limited"},{"symbol":"BAJAJ-AUTO","name":"Bajaj Auto Limited"},{"symbol":"BAJAJFINSV","name":"Bajaj Finserv Limited"},{"symbol":"BAJAJHFL","name":"Bajaj Housing Finance Limited"},{"symbol":"BAJFINANCE","name":"Bajaj Finance Limited"},{"symbol":"BALKRISIND","name":"Balkrishna Industries Limited"},{"symbol":"BANDHANBNK","name":"Bandhan Bank Limited"},{"symbol":"BANKBARODA","name":"Bank of Baroda"},{"symbol":"BANKINDIA","name":"Bank of India"},{"symbol":"BANSALWIRE","name":"Bansal Wire Industries Limited"},{"symbol":"BATAINDIA","name":"Bata India Limited"},{"symbol":"BDL","name":"Bharat Dynamics Limited"},{"symbol":"BEL","name":"Bharat Electronics Limited"},{"symbol":"BEML","name":"BEML Limited"},{"symbol":"BERGEPAINT","name":"Berger Paints (I) Limited"},{"symbol":"BHARATFORG","name":"Bharat Forge Limited"},{"symbol":"BHARTIARTL","name":"Bharti Airtel Limited"},{"symbol":"BHEL","name":"Bharat Heavy Electricals Limited"},{"symbol":"BIOCON","name":"Biocon Limited"},{"symbol":"BIRLACORPN","name":"Birla Corporation Limited"},{"symbol":"BLUEDART","name":"Blue Dart Express Limited"},{"symbol":"BLUESTARCO","name":"Blue Star Limited"},{"symbol":"BOSCHLTD","name":"Bosch Limited"},{"symbol":"BPCL","name":"Bharat Petroleum Corporation Limited"},{"symbol":"BRIGADE","name":"Brigade Enterprises Limited"},{"symbol":"BRITANNIA","name":"Britannia Industries Limited"},{"symbol":"BSE","name":"BSE Limited"},{"symbol":"BSOFT","name":"BIRLASOFT LIMITED"},{"symbol":"CAMS","name":"Computer Age Management Services Limited"},{"symbol":"CANBK","name":"Canara Bank"},{"symbol":"CANFINHOME","name":"Can Fin Homes Limited"},{"symbol":"CARBORUNIV","name":"Carborundum Universal Limited"},{"symbol":"CARERATING","name":"CARE Ratings Limited"},{"symbol":"CASTROLIND","name":"Castrol India Limited"},{"symbol":"CDSL","name":"Central Depository Services (India) Limited"},{"symbol":"CEATLTD","name":"CEAT Limited"},{"symbol":"CGPOWER","name":"CG Power and Industrial Solutions Limited"},{"symbol":"CHAMBLFERT","name":"Chambal Fertilizers & Chemicals Limited"},{"symbol":"CHOLAFIN","name":"Cholamandalam Investment and Finance Company Limited"},{"symbol":"CIPLA","name":"Cipla Limited"},{"symbol":"CLEAN","name":"Clean Science and Technology Limited"},{"symbol":"COALINDIA","name":"Coal India Limited"},{"symbol":"COCHINSHIP","name":"Cochin Shipyard Limited"},{"symbol":"COFORGE","name":"Coforge Limited"},{"symbol":"COLPAL","name":"Colgate Palmolive (India) Limited"},{"symbol":"CONCOR","name":"Container Corporation of India Limited"},{"symbol":"CONCORDBIO","name":"Concord Biotech Limited"},{"symbol":"COROMANDEL","name":"Coromandel International Limited"},{"symbol":"CREDITACC","name":"CREDITACCESS GRAMEEN LIMITED"},{"symbol":"CRISIL","name":"CRISIL Limited"},{"symbol":"CROMPTON","name":"Crompton Greaves Consumer Electricals Limited"},{"symbol":"CUB","name":"City Union Bank Limited"},{"symbol":"CUMMINSIND","name":"Cummins India Limited"},{"symbol":"CYIENT","name":"Cyient Limited"},{"symbol":"DABUR","name":"Dabur India Limited"},{"symbol":"DALBHARAT","name":"Dalmia Bharat Limited"},{"symbol":"DATAPATTNS","name":"Data Patterns (India) Limited"},{"symbol":"DCBBANK","name":"DCB Bank Limited"},{"symbol":"DCMSHRIRAM","name":"DCM Shriram Limited"},{"symbol":"DEEPAKFERT","name":"Deepak Fertilizers and Petrochemicals Corporation Limited"},{"symbol":"DEEPAKNTR","name":"Deepak Nitrite Limited"},{"symbol":"DELHIVERY","name":"Delhivery Limited"},{"symbol":"DELTACORP","name":"Delta Corp Limited"},{"symbol":"DEVYANI","name":"Devyani International Limited"},{"symbol":"DIVISLAB","name":"Divi's Laboratories Limited"},{"symbol":"DIXON","name":"Dixon Technologies (India) Limited"},{"symbol":"DLF","name":"DLF Limited"},{"symbol":"DMART","name":"Avenue Supermarts Limited"},{"symbol":"DRREDDY","name":"Dr. Reddy's Laboratories Limited"},{"symbol":"EDELWEISS","name":"Edelweiss Financial Services Limited"},{"symbol":"EICHERMOT","name":"Eicher Motors Limited"},{"symbol":"EIDPARRY","name":"EID Parry India Limited"},{"symbol":"ELGIEQUIP","name":"Elgi Equipments Limited"},{"symbol":"EMAMILTD","name":"Emami Limited"},{"symbol":"EMCURE","name":"Emcure Pharmaceuticals Limited"},{"symbol":"ENDURANCE","name":"Endurance Technologies Limited"},{"symbol":"ENGINERSIN","name":"Engineers India Limited"},{"symbol":"ESCORTS","name":"Escorts Kubota Limited"},{"symbol":"ETERNAL","name":"ETERNAL LIMITED"},{"symbol":"ETHOSLTD","name":"Ethos Limited"},{"symbol":"EXIDEIND","name":"Exide Industries Limited"},{"symbol":"FACT","name":"Fertilizers and Chemicals Travancore Limited"},{"symbol":"FEDERALBNK","name":"The Federal Bank Limited"},{"symbol":"FINCABLES","name":"Finolex Cables Limited"},{"symbol":"FINEORG","name":"Fine Organic Industries Limited"},{"symbol":"FINPIPE","name":"Finolex Industries Limited"},{"symbol":"FIVESTAR","name":"Five-Star Business Finance Limited"},{"symbol":"FORCEMOT","name":"FORCE MOTORS LTD"},{"symbol":"FORTIS","name":"Fortis Healthcare Limited"},{"symbol":"FSL","name":"Firstsource Solutions Limited"},{"symbol":"GABRIEL","name":"Gabriel India Limited"},{"symbol":"GAEL","name":"Gujarat Ambuja Exports Limited"},{"symbol":"GAIL","name":"GAIL (India) Limited"},{"symbol":"GALAXYSURF","name":"Galaxy Surfactants Limited"},{"symbol":"GARFIBRES","name":"Garware Technical Fibres Limited"},{"symbol":"GATEWAY","name":"Gateway Distriparks Limited"},{"symbol":"GICRE","name":"General Insurance Corporation of India"},{"symbol":"GILLETTE","name":"Gillette India Limited"},{"symbol":"GLAND","name":"Gland Pharma Limited"},{"symbol":"GLAXO","name":"GlaxoSmithKline Pharmaceuticals Limited"},{"symbol":"GLENMARK","name":"Glenmark Pharmaceuticals Limited"},{"symbol":"GMRAIRPORT","name":"GMR AIRPORTS LIMITED"},{"symbol":"GNFC","name":"Gujarat Narmada Valley Fertilizers and Chemicals Limited"},{"symbol":"GOACARBON","name":"Goa Carbon Limited"},{"symbol":"GODFRYPHLP","name":"Godfrey Phillips India Limited"},{"symbol":"GODIGIT","name":"Go Digit General Insurance Limited"},{"symbol":"GODREJAGRO","name":"Godrej Agrovet Limited"},{"symbol":"GODREJCP","name":"Godrej Consumer Products Limited"},{"symbol":"GODREJIND","name":"Godrej Industries Limited"},{"symbol":"GODREJPROP","name":"Godrej Properties Limited"},{"symbol":"GOKEX","name":"Gokaldas Exports Limited"},{"symbol":"GOPAL","name":"Gopal Snacks Limited"},{"symbol":"GPIL","name":"Godawari Power And Ispat limited"},{"symbol":"GPPL","name":"Gujarat Pipavav Port Limited"},{"symbol":"GRANULES","name":"Granules India Limited"},{"symbol":"GRAPHITE","name":"Graphite India Limited"},{"symbol":"GRASIM","name":"Grasim Industries Limited"},{"symbol":"GRAVITA","name":"Gravita India Limited"},{"symbol":"GREAVESCOT","name":"Greaves Cotton Limited"},{"symbol":"GREENLAM","name":"Greenlam Industries Limited"},{"symbol":"GREENPANEL","name":"Greenpanel Industries Limited"},{"symbol":"GREENPLY","name":"Greenply Industries Limited"},{"symbol":"GRINDWELL","name":"Grindwell Norton Limited"},{"symbol":"GRSE","name":"Garden Reach Shipbuilders & Engineers Limited"},{"symbol":"GSFC","name":"Gujarat State Fertilizers & Chemicals Limited"},{"symbol":"GSPL","name":"Gujarat State Petronet Limited"},{"symbol":"GUFICBIO","name":"Gufic Biosciences Limited"},{"symbol":"GUJGASLTD","name":"Gujarat Gas Limited"},{"symbol":"GULFOILLUB","name":"Gulf Oil Lubricants India Limited"},{"symbol":"HAL","name":"Hindustan Aeronautics Limited"},{"symbol":"HAPPSTMNDS","name":"Happiest Minds Technologies Limited"},{"symbol":"HAVELLS","name":"Havells India Limited"},{"symbol":"HAWKINCOOK","name":"Hawkins Cookers Limited"},{"symbol":"HCLTECH","name":"HCL Technologies Limited"},{"symbol":"HDFCAMC","name":"HDFC Asset Management Company Limited"},{"symbol":"HDFCBANK","name":"HDFC Bank Limited"},{"symbol":"HDFCLIFE","name":"HDFC Life Insurance Company Limited"},{"symbol":"HEG","name":"HEG Limited"},{"symbol":"HEROMOTOCO","name":"Hero MotoCorp Limited"},{"symbol":"HFCL","name":"HFCL Limited"},{"symbol":"HIKAL","name":"Hikal Limited"},{"symbol":"HINDALCO","name":"Hindalco Industries Limited"},{"symbol":"HINDCOPPER","name":"Hindustan Copper Limited"},{"symbol":"HINDPETRO","name":"Hindustan Petroleum Corporation Limited"},{"symbol":"HINDUNILVR","name":"Hindustan Unilever Limited"},{"symbol":"HINDZINC","name":"Hindustan Zinc Limited"},{"symbol":"HONASA","name":"Honasa Consumer Limited"},{"symbol":"HONAUT","name":"Honeywell Automation India Limited"},{"symbol":"HUDCO","name":"Housing & Urban Development Corporation Limited"},{"symbol":"HYUNDAI","name":"Hyundai Motor India Limited"},{"symbol":"ICICIBANK","name":"ICICI Bank Limited"},{"symbol":"ICICIGI","name":"ICICI Lombard General Insurance Company Limited"},{"symbol":"ICICIPRULI","name":"ICICI Prudential Life Insurance Company Limited"},{"symbol":"ICIL","name":"Indo Count Industries Limited"},{"symbol":"ICRA","name":"ICRA Limited"},{"symbol":"IDBI","name":"IDBI Bank Limited"},{"symbol":"IDEA","name":"Vodafone Idea Limited"},{"symbol":"IDFCFIRSTB","name":"IDFC First Bank Limited"},{"symbol":"IEX","name":"Indian Energy Exchange Limited"},{"symbol":"IIFL","name":"IIFL Finance Limited"},{"symbol":"IGL","name":"Indraprastha Gas Limited"},{"symbol":"INFY","name":"Infosys Limited"},{"symbol":"INOXWIND","name":"Inox Wind Limited"},{"symbol":"IOC","name":"Indian Oil Corporation Limited"},{"symbol":"IPCALAB","name":"IPCA Laboratories Limited"},{"symbol":"IRB","name":"IRB Infrastructure Developers Limited"},{"symbol":"IRCTC","name":"Indian Railway Catering And Tourism Corporation Limited"},{"symbol":"IREDA","name":"Indian Renewable Energy Development Agency Limited"},{"symbol":"IRFC","name":"Indian Railway Finance Corporation Limited"},{"symbol":"ITC","name":"ITC Limited"},{"symbol":"ITCHOTELS","name":"ITC Hotels Limited"},{"symbol":"JKCEMENT","name":"JK Cement Limited"},{"symbol":"JKLAKSHMI","name":"JK Lakshmi Cement Limited"},{"symbol":"JKPAPER","name":"JK Paper Limited"},{"symbol":"JSWENERGY","name":"JSW Energy Limited"},{"symbol":"JSWINFRA","name":"JSW Infrastructure Limited"},{"symbol":"JSWSTEEL","name":"JSW Steel Limited"},{"symbol":"JUBLFOOD","name":"Jubilant Foodworks Limited"},{"symbol":"JUSTDIAL","name":"Just Dial Limited"},{"symbol":"JYOTHYLAB","name":"Jyothy Labs Limited"},{"symbol":"JYOTICNC","name":"Jyoti CNC Automation Limited"},{"symbol":"KAJARIACER","name":"Kajaria Ceramics Limited"},{"symbol":"KALYANKJIL","name":"Kalyan Jewellers India Limited"},{"symbol":"KANSAINER","name":"Kansai Nerolac Paints Limited"},{"symbol":"KARURVYSYA","name":"Karur Vysya Bank Limited"},{"symbol":"KAYNES","name":"Kaynes Technology India Limited"},{"symbol":"KEC","name":"KEC International Limited"},{"symbol":"KEI","name":"KEI Industries Limited"},{"symbol":"KFINTECH","name":"Kfin Technologies Limited"},{"symbol":"KIMS","name":"Krishna Institute of Medical Sciences Limited"},{"symbol":"KIOCL","name":"KIOCL Limited"},{"symbol":"KIRLFER","name":"Kirloskar Ferrous Industries Limited"},{"symbol":"KIRLOSBROS","name":"Kirloskar Brothers Limited"},{"symbol":"KIRLOSENG","name":"Kirloskar Oil Engines Limited"},{"symbol":"KNRCON","name":"KNR Constructions Limited"},{"symbol":"KOTAKBANK","name":"Kotak Mahindra Bank Limited"},{"symbol":"KPIL","name":"Kalpataru Projects International Limited"},{"symbol":"KPITTECH","name":"KPIT Technologies Limited"},{"symbol":"KPRMILL","name":"K.P.R. Mill Limited"},{"symbol":"KRBL","name":"KRBL Limited"},{"symbol":"KRSNAA","name":"Krsnaa Diagnostics Limited"},{"symbol":"KSB","name":"Ksb Limited"},{"symbol":"KSCL","name":"Kaveri Seed Company Limited"},{"symbol":"LALPATHLAB","name":"Dr. Lal Path Labs Ltd."},{"symbol":"LAURUSLABS","name":"Laurus Labs Limited"},{"symbol":"LAXMIDENTL","name":"Laxmi Dental Limited"},{"symbol":"LEMONTREE","name":"Lemon Tree Hotels Limited"},{"symbol":"LICHSGFIN","name":"LIC Housing Finance Limited"},{"symbol":"LICI","name":"Life Insurance Corporation Of India"},{"symbol":"LINDEINDIA","name":"Linde India Limited"},{"symbol":"LLOYDSME","name":"Lloyds Metals And Energy Limited"},{"symbol":"LODHA","name":"Lodha Developers Limited"},{"symbol":"LT","name":"Larsen & Toubro Limited"},{"symbol":"LTF","name":"L&T Finance Limited"},{"symbol":"LTFOODS","name":"LT Foods Limited"},{"symbol":"LTTS","name":"L&T Technology Services Limited"},{"symbol":"LUMAXTECH","name":"Lumax Auto Technologies Limited"},{"symbol":"LUPIN","name":"Lupin Limited"},{"symbol":"LUXIND","name":"Lux Industries Limited"},{"symbol":"M&M","name":"Mahindra & Mahindra Limited"},{"symbol":"M&MFIN","name":"Mahindra & Mahindra Financial Services Limited"},{"symbol":"MARICO","name":"Marico Limited"},{"symbol":"MARUTI","name":"Maruti Suzuki India Limited"},{"symbol":"MASTEK","name":"Mastek Limited"},{"symbol":"MATRIMONY","name":"Matrimony.Com Limited"},{"symbol":"MAXHEALTH","name":"Max Healthcare Institute Limited"},{"symbol":"MAYURUNIQ","name":"Mayur Uniquoters Ltd"},{"symbol":"MAZDOCK","name":"Mazagon Dock Shipbuilders Limited"},{"symbol":"MCX","name":"Multi Commodity Exchange of India Limited"},{"symbol":"MEDANTA","name":"Global Health Limited"},{"symbol":"MEDPLUS","name":"Medplus Health Services Limited"},{"symbol":"METROBRAND","name":"Metro Brands Limited"},{"symbol":"METROPOLIS","name":"Metropolis Healthcare Limited"},{"symbol":"MGL","name":"Mahanagar Gas Limited"},{"symbol":"MINDACORP","name":"Minda Corporation Limited"},{"symbol":"MIRCELECTR","name":"MIRC Electronics Limited"},{"symbol":"MOIL","name":"MOIL Limited"},{"symbol":"MOLDTKPAC","name":"Mold-Tek Packaging Limited"},{"symbol":"MOTHERSON","name":"Samvardhana Motherson International Limited"},{"symbol":"MOTILALOFS","name":"Motilal Oswal Financial Services Limited"},{"symbol":"MPHASIS","name":"MphasiS Limited"},{"symbol":"MRF","name":"MRF Limited"},{"symbol":"MRPL","name":"Mangalore Refinery and Petrochemicals Limited"},{"symbol":"MUTHOOTFIN","name":"Muthoot Finance Limited"},{"symbol":"NAM-INDIA","name":"Nippon Life India Asset Management Limited"},{"symbol":"NATCOPHARM","name":"Natco Pharma Limited"},{"symbol":"NATIONALUM","name":"National Aluminium Company Limited"},{"symbol":"NAUKRI","name":"Info Edge (India) Limited"},{"symbol":"NAVINFLUOR","name":"Navin Fluorine International Limited"},{"symbol":"NAZARA","name":"Nazara Technologies Limited"},{"symbol":"NBCC","name":"NBCC (India) Limited"},{"symbol":"NCC","name":"NCC Limited"},{"symbol":"NESTLEIND","name":"Nestle India Limited"},{"symbol":"NETWEB","name":"Netweb Technologies India Limited"},{"symbol":"NEULANDLAB","name":"Neuland Laboratories Limited"},{"symbol":"NEWGEN","name":"Newgen Software Technologies Limited"},{"symbol":"NFL","name":"National Fertilizers Limited"},{"symbol":"NH","name":"Narayana Hrudayalaya Ltd."},{"symbol":"NHPC","name":"NHPC Limited"},{"symbol":"NIACL","name":"The New India Assurance Company Limited"},{"symbol":"NIITLTD","name":"NIIT Limited"},{"symbol":"NILKAMAL","name":"Nilkamal Limited"},{"symbol":"NLCINDIA","name":"NLC India Limited"},{"symbol":"NMDC","name":"NMDC Limited"},{"symbol":"NOCIL","name":"NOCIL Limited"},{"symbol":"NTPC","name":"NTPC Limited"},{"symbol":"NTPCGREEN","name":"NTPC Green Energy Limited"},{"symbol":"NUCLEUS","name":"Nucleus Software Exports Limited"},{"symbol":"NUVAMA","name":"Nuvama Wealth Management Limited"},{"symbol":"NUVOCO","name":"Nuvoco Vistas Corporation Limited"},{"symbol":"NYKAA","name":"FSN E-Commerce Ventures Limited"},{"symbol":"OBEROIRLTY","name":"Oberoi Realty Limited"},{"symbol":"OFSS","name":"Oracle Financial Services Software Limited"},{"symbol":"OIL","name":"Oil India Limited"},{"symbol":"OLAELEC","name":"Ola Electric Mobility Limited"},{"symbol":"OLECTRA","name":"Olectra Greentech Limited"},{"symbol":"ONGC","name":"Oil & Natural Gas Corporation Limited"},{"symbol":"PAGEIND","name":"Page Industries Limited"},{"symbol":"PANACEABIO","name":"Panacea Biotec Limited"},{"symbol":"PARADEEP","name":"Paradeep Phosphates Limited"},{"symbol":"PARAGMILK","name":"Parag Milk Foods Limited"},{"symbol":"PARAS","name":"Paras Defence and Space Technologies Limited"},{"symbol":"PATELENG","name":"Patel Engineering Limited"},{"symbol":"PAYTM","name":"One 97 Communications Limited"},{"symbol":"PCBL","name":"PCBL Chemical Limited"},{"symbol":"PERSISTENT","name":"Persistent Systems Limited"},{"symbol":"PETRONET","name":"Petronet LNG Limited"},{"symbol":"PFC","name":"Power Finance Corporation Limited"},{"symbol":"PFIZER","name":"Pfizer Limited"},{"symbol":"PGEL","name":"PG Electroplast Limited"},{"symbol":"PGHH","name":"Procter & Gamble Hygiene and Health Care Limited"},{"symbol":"PHOENIXLTD","name":"The Phoenix Mills Limited"},{"symbol":"PIDILITIND","name":"Pidilite Industries Limited"},{"symbol":"PIIND","name":"PI Industries Limited"},{"symbol":"PINELABS","name":"Pine Labs Limited"},{"symbol":"PIRAMALFIN","name":"Piramal Finance Limited"},{"symbol":"PNB","name":"Punjab National Bank"},{"symbol":"PNBHOUSING","name":"PNB Housing Finance Limited"},{"symbol":"PNCINFRA","name":"PNC Infratech Limited"},{"symbol":"POLICYBZR","name":"PB Fintech Limited"},{"symbol":"POLYCAB","name":"Polycab India Limited"},{"symbol":"POLYMED","name":"Poly Medicure Limited"},{"symbol":"POONAWALLA","name":"Poonawalla Fincorp Limited"},{"symbol":"POWERGRID","name":"Power Grid Corporation of India Limited"},{"symbol":"POWERMECH","name":"Power Mech Projects Limited"},{"symbol":"PRAJIND","name":"Praj Industries Limited"},{"symbol":"PREMIERENE","name":"Premier Energies Limited"},{"symbol":"PRESTIGE","name":"Prestige Estates Projects Limited"},{"symbol":"PRICOLLTD","name":"Pricol Limited"},{"symbol":"PRINCEPIPE","name":"Prince Pipes And Fittings Limited"},{"symbol":"PRIVISCL","name":"Privi Speciality Chemicals Limited"},{"symbol":"PRUDENT","name":"Prudent Corporate Advisory Services Limited"},{"symbol":"PSB","name":"Punjab & Sind Bank"},{"symbol":"PSPPROJECT","name":"PSP Projects Limited"},{"symbol":"PTC","name":"PTC India Limited"},{"symbol":"PVRINOX","name":"PVR INOX Limited"},{"symbol":"RADICO","name":"Radico Khaitan Limited"},{"symbol":"RAILTEL","name":"Railtel Corporation Of India Limited"},{"symbol":"RAIN","name":"Rain Industries Limited"},{"symbol":"RAINBOW","name":"Rainbow Childrens Medicare Limited"},{"symbol":"RAJESHEXPO","name":"Rajesh Exports Limited"},{"symbol":"RALLIS","name":"Rallis India Limited"},{"symbol":"RAMCOCEM","name":"The Ramco Cements Limited"},{"symbol":"RATNAMANI","name":"Ratnamani Metals & Tubes Limited"},{"symbol":"RAYMOND","name":"Raymond Limited"},{"symbol":"RBLBANK","name":"RBL Bank Limited"},{"symbol":"RCF","name":"Rashtriya Chemicals and Fertilizers Limited"},{"symbol":"RECLTD","name":"REC Limited"},{"symbol":"REDINGTON","name":"Redington Limited"},{"symbol":"RELIANCE","name":"Reliance Industries Limited"},{"symbol":"RELAXO","name":"Relaxo Footwears Limited"},{"symbol":"ROSSARI","name":"Rossari Biotech Limited"},{"symbol":"ROUTE","name":"ROUTE MOBILE LIMITED"},{"symbol":"RPGLIFE","name":"RPG Life Sciences Limited"},{"symbol":"RRKABEL","name":"R R Kabel Limited"},{"symbol":"RVNL","name":"Rail Vikas Nigam Limited"},{"symbol":"SAFARI","name":"Safari Industries (India) Limited"},{"symbol":"SAGILITY","name":"SAGILITY LIMITED"},{"symbol":"SAIL","name":"Steel Authority of India Limited"},{"symbol":"SAILIFE","name":"Sai Life Sciences Limited"},{"symbol":"SANSERA","name":"Sansera Engineering Limited"},{"symbol":"SANOFI","name":"Sanofi India Limited"},{"symbol":"SAPPHIRE","name":"Sapphire Foods India Limited"},{"symbol":"SAREGAMA","name":"Saregama India Limited"},{"symbol":"SASKEN","name":"Sasken Technologies Limited"},{"symbol":"SBICARD","name":"SBI Cards and Payment Services Limited"},{"symbol":"SBILIFE","name":"SBI Life Insurance Company Limited"},{"symbol":"SBIN","name":"State Bank of India"},{"symbol":"SCHAEFFLER","name":"Schaeffler India Limited"},{"symbol":"SCHNEIDER","name":"Schneider Electric Infrastructure Limited"},{"symbol":"SENCO","name":"Senco Gold Limited"},{"symbol":"SFL","name":"Sheela Foam Limited"},{"symbol":"SHARDACROP","name":"Sharda Cropchem Limited"},{"symbol":"SHRIRAMFIN","name":"Shriram Finance Limited"},{"symbol":"SIEMENS","name":"Siemens Limited"},{"symbol":"SIGNATURE","name":"Signatureglobal (India) Limited"},{"symbol":"SJVN","name":"SJVN Limited"},{"symbol":"SKFINDIA","name":"SKF India Limited"},{"symbol":"SKIPPER","name":"Skipper Limited"},{"symbol":"SOBHA","name":"Sobha Limited"},{"symbol":"SOLARA","name":"Solara Active Pharma Sciences Limited"},{"symbol":"SOLARINDS","name":"Solar Industries India Limited"},{"symbol":"SOMANYCERA","name":"Somany Ceramics Limited"},{"symbol":"SONACOMS","name":"Sona BLW Precision Forgings Limited"},{"symbol":"SONATSOFTW","name":"Sonata Software Limited"},{"symbol":"SOUTHBANK","name":"The South Indian Bank Limited"},{"symbol":"SRF","name":"SRF Limited"},{"symbol":"STARCEMENT","name":"Star Cement Limited"},{"symbol":"STARHEALTH","name":"Star Health and Allied Insurance Company Limited"},{"symbol":"STLTECH","name":"Sterlite Technologies Limited"},{"symbol":"SUBROS","name":"Subros Limited"},{"symbol":"SUDARSCHEM","name":"Sudarshan Chemical Industries Limited"},{"symbol":"SULA","name":"Sula Vineyards Limited"},{"symbol":"SUMICHEM","name":"Sumitomo Chemical India Limited"},{"symbol":"SUNDARMFIN","name":"Sundaram Finance Limited"},{"symbol":"SUNDRMFAST","name":"Sundram Fasteners Limited"},{"symbol":"SUNPHARMA","name":"Sun Pharmaceutical Industries Limited"},{"symbol":"SUNTECK","name":"Sunteck Realty Limited"},{"symbol":"SUNTV","name":"Sun TV Network Limited"},{"symbol":"SUPRAJIT","name":"Suprajit Engineering Limited"},{"symbol":"SUPREMEIND","name":"Supreme Industries Limited"},{"symbol":"SUPRIYA","name":"Supriya Lifescience Limited"},{"symbol":"SURYAROSNI","name":"Surya Roshni Limited"},{"symbol":"SUZLON","name":"Suzlon Energy Limited"},{"symbol":"SYMPHONY","name":"Symphony Limited"},{"symbol":"SYNGENE","name":"Syngene International Limited"},{"symbol":"SYRMA","name":"Syrma SGS Technology Limited"},{"symbol":"TANLA","name":"Tanla Platforms Limited"},{"symbol":"TATACOMM","name":"Tata Communications Limited"},{"symbol":"TATACONSUM","name":"TATA CONSUMER PRODUCTS LIMITED"},{"symbol":"TATAELXSI","name":"Tata Elxsi Limited"},{"symbol":"TATAINVEST","name":"Tata Investment Corporation Limited"},{"symbol":"TATAPOWER","name":"Tata Power Company Limited"},{"symbol":"TATASTEEL","name":"Tata Steel Limited"},{"symbol":"TATATECH","name":"Tata Technologies Limited"},{"symbol":"TCS","name":"Tata Consultancy Services Limited"},{"symbol":"TEAMLEASE","name":"Teamlease Services Limited"},{"symbol":"TECHM","name":"Tech Mahindra Limited"},{"symbol":"TECHNOE","name":"Techno Electric & Engineering Company Limited"},{"symbol":"TEGA","name":"Tega Industries Limited"},{"symbol":"TEJASNET","name":"Tejas Networks Limited"},{"symbol":"THERMAX","name":"Thermax Limited"},{"symbol":"THYROCARE","name":"Thyrocare Technologies Limited"},{"symbol":"TIINDIA","name":"Tube Investments of India Limited"},{"symbol":"TIMKEN","name":"Timken India Limited"},{"symbol":"TIPSMUSIC","name":"Tips Music Limited"},{"symbol":"TITAN","name":"Titan Company Limited"},{"symbol":"TMB","name":"Tamilnad Mercantile Bank Limited"},{"symbol":"TNPL","name":"Tamil Nadu Newsprint & Papers Limited"},{"symbol":"TORNTPHARM","name":"Torrent Pharmaceuticals Limited"},{"symbol":"TORNTPOWER","name":"Torrent Power Limited"},{"symbol":"TRENT","name":"Trent Limited"},{"symbol":"TRIDENT","name":"Trident Limited"},{"symbol":"TRITURBINE","name":"Triveni Turbine Limited"},{"symbol":"TRIVENI","name":"Triveni Engineering & Industries Limited"},{"symbol":"TTKHLTCARE","name":"TTK Healthcare Limited"},{"symbol":"TTKPRESTIG","name":"TTK Prestige Limited"},{"symbol":"TVSMOTOR","name":"TVS Motor Company Limited"},{"symbol":"TVSSRICHAK","name":"TVS Srichakra Limited"},{"symbol":"UBL","name":"United Breweries Limited"},{"symbol":"UFLEX","name":"UFLEX Limited"},{"symbol":"UJJIVANSFB","name":"Ujjivan Small Finance Bank Limited"},{"symbol":"ULTRACEMCO","name":"UltraTech Cement Limited"},{"symbol":"UNICHEMLAB","name":"Unichem Laboratories Limited"},{"symbol":"UNIONBANK","name":"Union Bank of India"},{"symbol":"UNIPARTS","name":"Uniparts India Limited"},{"symbol":"UNITDSPR","name":"United Spirits Limited"},{"symbol":"UNOMINDA","name":"UNO Minda Limited"},{"symbol":"UPL","name":"UPL Limited"},{"symbol":"USHAMART","name":"Usha Martin Limited"},{"symbol":"UTIAMC","name":"UTI Asset Management Company Limited"},{"symbol":"V2RETAIL","name":"V2 Retail Limited"},{"symbol":"VAIBHAVGBL","name":"Vaibhav Global Limited"},{"symbol":"VAKRANGEE","name":"Vakrangee Limited"},{"symbol":"VBL","name":"Varun Beverages Limited"},{"symbol":"VEDL","name":"Vedanta Limited"},{"symbol":"VENKEYS","name":"Venky's (India) Limited"},{"symbol":"VESUVIUS","name":"Vesuvius India Limited"},{"symbol":"VGUARD","name":"V-Guard Industries Limited"},{"symbol":"VINATIORGA","name":"Vinati Organics Limited"},{"symbol":"VINDHYATEL","name":"Vindhya Telelinks Limited"},{"symbol":"VIPIND","name":"VIP Industries Limited"},{"symbol":"VOLTAS","name":"Voltas Limited"},{"symbol":"WAAREEENER","name":"Waaree Energies Limited"},{"symbol":"WABAG","name":"VA Tech Wabag Limited"},{"symbol":"WELCORP","name":"Welspun Corp Limited"},{"symbol":"WELSPUNLIV","name":"Welspun Living Limited"},{"symbol":"WESTLIFE","name":"WESTLIFE FOODWORLD LIMITED"},{"symbol":"WHIRLPOOL","name":"Whirlpool of India Limited"},{"symbol":"WIPRO","name":"Wipro Limited"},{"symbol":"WOCKPHARMA","name":"Wockhardt Limited"},{"symbol":"WONDERLA","name":"Wonderla Holidays Limited"},{"symbol":"YESBANK","name":"Yes Bank Limited"},{"symbol":"ZAGGLE","name":"Zaggle Prepaid Ocean Services Limited"},{"symbol":"ZEEL","name":"Zee Entertainment Enterprises Limited"},{"symbol":"ZENSARTECH","name":"Zensar Technologies Limited"},{"symbol":"ZENTEC","name":"Zen Technologies Limited"},{"symbol":"ZYDUSLIFE","name":"Zydus Lifesciences Limited"},{"symbol":"ZYDUSWELL","name":"Zydus Wellness Limited"}];

type Segment = 'Equity' | 'Futures' | 'Options' | 'Portfolio';
type ActionType = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';
type Horizon = '1 Year' | '2 Years' | '3 Years' | '4 Years' | '5 Years';
type AdminRole = 'master' | 'admin';

interface Trade {
  id: string;
  _collection: string;
  stockName?: string;
  symbol?: string;
  segment?: string;
  action?: ActionType;
  type?: ActionType;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  lotSize?: number;
  expiryDate?: string;
  strikePrice?: number;
  optionType?: OptionType;
  duration?: string;
  horizon?: string;
  pdfUrl?: string;
  pdfName?: string;
  status?: string;
  showInApp?: boolean;
  postedBy?: string;
  postedByEmail?: string;
  createdAt: any;
}

const emptyForm = {
  symbol: '',
  segment: 'Equity' as Segment,
  action: 'BUY' as ActionType,
  entryPrice: '',
  targetPrice: '',
  stopLoss: '',
  lotSize: '',
  expiryDate: '',
  strikePrice: '',
  optionType: 'CE' as OptionType,
  duration: '',
  horizon: '1 Year' as Horizon,
  rationale: '',
};

export default function AdminActiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [currentUid, setCurrentUid] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCollection, setEditCollection] = useState<string>('activeTrades');
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTrade, setMenuTrade] = useState<Trade | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Load admin role on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setCurrentUid(user.uid);
    setCurrentEmail(user.email || '');

    getDoc(doc(db, 'adminUsers', user.uid)).then((snap) => {
      if (snap.exists()) {
        const role = snap.data()?.role === 'master' ? 'master' : 'admin';
        setAdminRole(role);
      } else {
        // If no doc, default to admin (limited)
        setAdminRole('admin');
      }
      setRoleLoading(false);
    }).catch(() => {
      setAdminRole('admin');
      setRoleLoading(false);
    });
  }, []);

  // Fetch trades after role is known
  useEffect(() => {
    if (roleLoading || !adminRole) return;

    const allTrades: { [id: string]: Trade } = {};

    const q1 = query(collection(db, 'activeTrades'));
    const unsub1 = onSnapshot(q1, (snap) => {
      Object.keys(allTrades).forEach(k => {
        if (allTrades[k]._collection === 'activeTrades') delete allTrades[k];
      });
      snap.docs.forEach(d => {
        allTrades[`activeTrades_${d.id}`] = { id: d.id, _collection: 'activeTrades', ...d.data() } as Trade;
      });
      updateTrades();
    });

    const q2 = query(collection(db, 'trades'));
    const unsub2 = onSnapshot(q2, (snap) => {
      Object.keys(allTrades).forEach(k => {
        if (allTrades[k]._collection === 'trades') delete allTrades[k];
      });
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.status || data.status === 'active' || data.status === 'Active') {
          allTrades[`trades_${d.id}`] = { id: d.id, _collection: 'trades', ...data } as Trade;
        }
      });
      updateTrades();
    });

    const q3 = query(collection(db, 'portfolioStocks'));
    const unsub3 = onSnapshot(q3, (snap) => {
      Object.keys(allTrades).forEach(k => {
        if (allTrades[k]._collection === 'portfolioStocks') delete allTrades[k];
      });
      snap.docs.forEach(d => {
        allTrades[`portfolioStocks_${d.id}`] = { id: d.id, _collection: 'portfolioStocks', ...d.data() } as Trade;
      });
      updateTrades();
    });

    function updateTrades() {
      let filtered = Object.values(allTrades);

      // Non-master admins only see their own trades
      if (adminRole === 'admin') {
        filtered = filtered.filter(t => t.postedBy === currentUid);
      }

      const sorted = filtered.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setTrades(sorted);
    }

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [adminRole, roleLoading, currentUid]);

  const isFutOpt    = form.segment === 'Futures' || form.segment === 'Options';
  const isOptions   = form.segment === 'Options';
  const isPortfolio = form.segment === 'Portfolio';

  const filteredStocks = stockSearch.length > 0
    ? NSE_STOCKS.filter(o =>
        o.symbol.startsWith(stockSearch.toUpperCase()) ||
        o.name.toUpperCase().includes(stockSearch.toUpperCase())
      ).slice(0, 50)
    : [];

  const calcPotential = () => {
    const entry  = parseFloat(form.entryPrice);
    const target = parseFloat(form.targetPrice);
    const sl     = parseFloat(form.stopLoss);
    if (!entry || entry <= 0) return null;
    const gain = target > 0
      ? form.action === 'BUY'
        ? ((target - entry) / entry) * 100
        : ((entry - target) / entry) * 100
      : null;
    const loss = sl > 0
      ? form.action === 'BUY'
        ? ((entry - sl) / entry) * 100
        : ((sl - entry) / entry) * 100
      : null;
    return { gain, loss };
  };
  const calc = calcPotential();

  const showSnackbar   = (message: string, severity: 'success' | 'error') => setSnackbar({ open: true, message, severity });
  const getDisplayName = (trade: Trade) => trade.stockName || trade.symbol || '—';
  const getDisplayType = (trade: Trade) => trade.type || trade.action || 'BUY';

  const getSegmentColor = (segment?: string) => {
    const s = segment?.toLowerCase();
    if (s === 'options')   return '#7b1fa2';
    if (s === 'futures')   return '#1565c0';
    if (s === 'portfolio') return '#1a6030';
    return '#2e7d32';
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleShowInApp = async (trade: Trade) => {
    await updateDoc(doc(db, trade._collection, trade.id), { showInApp: trade.showInApp === false ? true : false });
  };

  const handleOpenAdd = () => { setEditId(null); setForm(emptyForm); setPdfFile(null); setStockSearch(''); setModalOpen(true); };

  const handleEdit = (trade: Trade) => {
    setEditId(trade.id);
    setEditCollection(trade._collection);
    const seg = trade.segment || 'equity';
    const segCapital = (seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()) as Segment;
    setForm({
      symbol:      getDisplayName(trade),
      segment:     segCapital,
      action:      getDisplayType(trade) as ActionType,
      entryPrice:  String(trade.entryPrice),
      targetPrice: String(trade.targetPrice),
      stopLoss:    String(trade.stopLoss),
      lotSize:     trade.lotSize     ? String(trade.lotSize)     : '',
      expiryDate:  trade.expiryDate  || '',
      strikePrice: trade.strikePrice ? String(trade.strikePrice) : '',
      optionType:  trade.optionType  || 'CE',
      duration:    trade.duration    || '',
      horizon:     (trade.horizon as Horizon) || '1 Year',
      rationale:   '',
    });
    setStockSearch(getDisplayName(trade));
    setPdfFile(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); setPdfFile(null); setStockSearch(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        stockName:      form.symbol.toUpperCase(),
        symbol:         form.symbol.toUpperCase(),
        segment:        form.segment.toLowerCase(),
        type:           form.action,
        action:         form.action,
        entryPrice:     parseFloat(form.entryPrice),
        targetPrice:    parseFloat(form.targetPrice),
        stopLoss:       parseFloat(form.stopLoss),
        status:         'active',
        postedBy:       currentUid,
        postedByEmail:  currentEmail,
      };
      if (isFutOpt && form.lotSize)      payload.lotSize     = parseInt(form.lotSize);
      if (isFutOpt && form.expiryDate)   payload.expiryDate  = form.expiryDate;
      if (isFutOpt && form.duration)     payload.duration    = form.duration;
      if (isOptions && form.strikePrice) payload.strikePrice = parseFloat(form.strikePrice);
      if (isOptions)                     payload.optionType  = form.optionType;
      if (isPortfolio) {
        payload.horizon   = form.horizon;
        payload.rationale = form.rationale;
        if (pdfFile) payload.pdfName = pdfFile.name;
      }
      if (editId) {
        await updateDoc(doc(db, editCollection, editId), payload);
        showSnackbar('Trade updated!', 'success');
      } else {
        payload.createdAt = serverTimestamp();
        payload.showInApp = true;
        await addDoc(collection(db, isPortfolio ? 'portfolioStocks' : 'activeTrades'), payload);
        showSnackbar(isPortfolio ? 'Portfolio stock added!' : 'Trade added!', 'success');
      }
      handleCloseModal();
    } catch (err) {
      showSnackbar('Error saving trade', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (trade: Trade) => {
    if (!window.confirm('Delete this trade?')) return;
    await deleteDoc(doc(db, trade._collection, trade.id));
    showSnackbar('Trade deleted', 'success');
  };

  const handleOpenCloseDialog = (trade: Trade) => {
    setTradeToClose(trade);
    setExitPrice('');
    setCloseDialogOpen(true);
  };

  const handleCloseTrade = async () => {
    if (!tradeToClose || !exitPrice) return;
    setLoading(true);
    try {
      const exitPriceNum      = parseFloat(exitPrice);
      const profitLossPercent = ((exitPriceNum - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100;
      await addDoc(collection(db, 'closedTrades'), {
        stockName:         getDisplayName(tradeToClose),
        symbol:            getDisplayName(tradeToClose),
        type:              getDisplayType(tradeToClose),
        action:            getDisplayType(tradeToClose),
        segment:           (tradeToClose.segment || 'equity').toLowerCase(),
        entryPrice:        tradeToClose.entryPrice,
        exitPrice:         exitPriceNum,
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        lotSize:           tradeToClose.lotSize     || null,
        expiryDate:        tradeToClose.expiryDate  || null,
        strikePrice:       tradeToClose.strikePrice || null,
        optionType:        tradeToClose.optionType  || null,
        postedBy:          tradeToClose.postedBy    || null,
        postedByEmail:     tradeToClose.postedByEmail || null,
        closedAt:          new Date().toISOString(),
      });
      await deleteDoc(doc(db, tradeToClose._collection, tradeToClose.id));
      showSnackbar('Trade closed successfully!', 'success');
      setCloseDialogOpen(false);
      setTradeToClose(null);
      setExitPrice('');
    } catch (err) {
      showSnackbar('Error closing trade', 'error');
    }
    setLoading(false);
  };

  const handleMenuOpen  = (e: React.MouseEvent<HTMLElement>, trade: Trade) => { setMenuAnchor(e.currentTarget); setMenuTrade(trade); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuTrade(null); };

  if (roleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Active Trades</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" color="text.secondary">
              {adminRole === 'master' ? 'Viewing all trades from all admins' : 'Viewing your trades only'}
            </Typography>
            <Chip
              size="small"
              label={adminRole === 'master' ? 'MASTER' : 'ADMIN'}
              sx={{
                backgroundColor: adminRole === 'master' ? '#1a237e' : '#2e7d32',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 10,
              }}
            />
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}
          sx={{ backgroundColor: '#1a237e', mt: 1, borderRadius: 2, px: 3 }}>
          ADD TRADE
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Trades {adminRole === 'master' && `(${trades.length} total)`}
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  'Stock', 'Segment', 'Type', 'Entry', 'Target', 'Stop Loss',
                  'Gain%', 'Risk%', 'Details',
                  ...(adminRole === 'master' ? ['Posted By'] : []),
                  'Show In App', 'Created', 'Actions'
                ].map(h => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((trade) => {
                const gain = trade.entryPrice > 0 ? (((trade.targetPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2) : null;
                const risk = trade.entryPrice > 0 && trade.stopLoss > 0 ? (((trade.entryPrice - trade.stopLoss) / trade.entryPrice) * 100).toFixed(2) : null;
                return (
                  <TableRow key={`${trade._collection}_${trade.id}`} hover>
                    <TableCell>
                      <Box>
                        <strong>{getDisplayName(trade)}</strong>
                        {trade.segment?.toLowerCase() === 'portfolio' && (
                          <Typography variant="caption" display="block" color="success.dark">Portfolio / Long Term</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={(trade.segment || 'equity').toUpperCase()}
                        sx={{ backgroundColor: getSegmentColor(trade.segment), color: '#fff', fontWeight: 'bold', fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={getDisplayType(trade)}
                        sx={{ backgroundColor: getDisplayType(trade) === 'BUY' ? '#2e7d32' : '#c62828', color: '#fff', fontWeight: 'bold', fontSize: 11 }} />
                    </TableCell>
                    <TableCell>&#8377;{trade.entryPrice}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>&#8377;{trade.targetPrice}</TableCell>
                    <TableCell sx={{ color: 'red',   fontWeight: 'bold' }}>&#8377;{trade.stopLoss}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>{gain ? `+${gain}%` : '—'}</TableCell>
                    <TableCell sx={{ color: 'red',   fontWeight: 'bold' }}>{risk ? `-${risk}%` : '—'}</TableCell>
                    <TableCell>
                      {trade.strikePrice && <Typography variant="caption" display="block">Strike: &#8377;{trade.strikePrice} {trade.optionType}</Typography>}
                      {trade.expiryDate  && <Typography variant="caption" display="block" color="text.secondary">Expiry: {trade.expiryDate}</Typography>}
                      {trade.lotSize     && <Typography variant="caption" display="block" color="text.secondary">Lot: {trade.lotSize}</Typography>}
                      {trade.duration    && <Typography variant="caption" display="block" color="text.secondary">{trade.duration}</Typography>}
                      {trade.horizon     && <Typography variant="caption" display="block" color="success.dark">Horizon: {trade.horizon}</Typography>}
                      {trade.pdfName     && <Typography variant="caption" display="block" color="primary">&#128196; {trade.pdfName}</Typography>}
                    </TableCell>
                    {adminRole === 'master' && (
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                          {trade.postedByEmail || '—'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Switch checked={trade.showInApp !== false} onChange={() => handleToggleShowInApp(trade)} color="success" size="small" />
                    </TableCell>
                    <TableCell>{formatDate(trade.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, trade)}><MoreVert fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={adminRole === 'master' ? 13 : 12} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      {adminRole === 'admin' ? 'You have not posted any trades yet' : 'No active trades found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { if (menuTrade) handleEdit(menuTrade); handleMenuClose(); }}>
          <Edit fontSize="small" sx={{ mr: 1, color: '#1a237e' }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { if (menuTrade) handleOpenCloseDialog(menuTrade); handleMenuClose(); }}>
          <Close fontSize="small" sx={{ mr: 1, color: '#ed6c02' }} /> Close Trade
        </MenuItem>
        <MenuItem onClick={() => { if (menuTrade) handleDelete(menuTrade); handleMenuClose(); }}>
          <Delete fontSize="small" sx={{ mr: 1, color: '#d32f2f' }} /> Delete
        </MenuItem>
      </Menu>

      {/* ADD / EDIT MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 22 }}>{editId ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>

            <Autocomplete
              options={filteredStocks}
              getOptionLabel={(option) => typeof option === 'string' ? option : `${option.symbol} - ${option.name}`}
              filterOptions={(x) => x}
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                  setStockSearch(newInputValue);
                  setForm({ ...form, symbol: newInputValue.toUpperCase() });
                }
              }}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== 'string') {
                  setForm({ ...form, symbol: newValue.symbol });
                  setStockSearch(newValue.symbol);
                }
              }}
              freeSolo
              renderInput={(params) => (
                <TextField {...params} fullWidth label="Stock Name (NSE)" required
                  placeholder="Type to search e.g. RELIANCE" sx={{ mb: 2 }} />
              )}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Segment</InputLabel>
              <Select label="Segment" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value as Segment })}>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Futures">Futures</MenuItem>
                <MenuItem value="Options">Options</MenuItem>
                <MenuItem value="Portfolio">Portfolio</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label="Entry Price" required type="number"
              value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Target Price" required type="number"
              value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Stop Loss" required type="number"
              value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} sx={{ mb: 2 }} />

            {calc && (calc.gain !== null || calc.loss !== null) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {calc.gain !== null && (
                  <Alert severity="success" icon="&#128200;" sx={{ flex: 1, py: 0.5 }}>
                    <strong>Potential Gain: +{calc.gain.toFixed(2)}%</strong>
                  </Alert>
                )}
                {calc.loss !== null && (
                  <Alert severity="error" icon="&#128201;" sx={{ flex: 1, py: 0.5 }}>
                    <strong>Risk: -{Math.abs(calc.loss).toFixed(2)}%</strong>
                  </Alert>
                )}
              </Box>
            )}

            {isFutOpt && (
              <Box sx={{ backgroundColor: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary"
                  sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>{form.segment} Fields</Typography>
                <TextField fullWidth label="Lot Size" type="number" size="small"
                  value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Expiry Date" type="date" size="small"
                  value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="Duration" size="small" placeholder="e.g. Weekly"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  sx={{ mb: isOptions ? 2 : 0 }} />
                {isOptions && (
                  <>
                    <TextField fullWidth label="Strike Price" type="number" size="small"
                      value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small">
                      <InputLabel>Option Type</InputLabel>
                      <Select label="Option Type" value={form.optionType}
                        onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}>
                        <MenuItem value="CE">CE</MenuItem>
                        <MenuItem value="PE">PE</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
            )}

            {isPortfolio && (
              <Box sx={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="success.dark"
                  sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>Portfolio Fields</Typography>
                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Investment Horizon</InputLabel>
                  <Select label="Investment Horizon" value={form.horizon}
                    onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })}>
                    <MenuItem value="1 Year">1 Year</MenuItem>
                    <MenuItem value="2 Years">2 Years</MenuItem>
                    <MenuItem value="3 Years">3 Years</MenuItem>
                    <MenuItem value="4 Years">4 Years</MenuItem>
                    <MenuItem value="5 Years">5 Years</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Rationale (Why this stock?)" multiline rows={2} size="small"
                  value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                  placeholder="Brief reason..." sx={{ mb: 2 }} />
                <Button variant="outlined" component="label" startIcon={<UploadFile />} color="success" size="small" fullWidth>
                  {pdfFile ? `${pdfFile.name}` : 'Upload Research Report PDF (Optional)'}
                  <input type="file" accept=".pdf" hidden onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleCloseModal} variant="outlined">CANCEL</Button>
            <Button type="submit" variant="contained" disabled={loading}
              sx={{ backgroundColor: isPortfolio ? '#1a6030' : '#1a237e', px: 4 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : editId ? 'UPDATE' : 'ADD'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* CLOSE TRADE DIALOG */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Close Trade</DialogTitle>
        <DialogContent>
          {tradeToClose && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closing <strong>{getDisplayName(tradeToClose)}</strong> | Entry: &#8377;{tradeToClose.entryPrice}
              </Typography>
              <TextField fullWidth label="Exit Price" type="number" value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)} sx={{ mt: 2 }} autoFocus />
              {exitPrice && (
                <Alert severity={parseFloat(exitPrice) >= tradeToClose.entryPrice ? 'success' : 'error'} sx={{ mt: 2 }}>
                  P&L: <strong>{(((parseFloat(exitPrice) - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100).toFixed(2)}%</strong>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCloseDialogOpen(false)} variant="outlined">CANCEL</Button>
          <Button onClick={handleCloseTrade} variant="contained" color="success" disabled={!exitPrice || loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'CLOSE TRADE'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
