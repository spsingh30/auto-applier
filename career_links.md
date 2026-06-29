# Company Career Pages — Login & CAPTCHA Reference

> **Last compiled:** 2026-06-27
> **Source:** Knowledge-based mapping of each company to its career portal + Applicant Tracking System (ATS).
> **Accuracy note:** `career_url` is generally stable. `ats` and `captcha` are **inferred from the ATS, not live-verified** — companies switch providers and CAPTCHA only truly appears at submit-time. Let your tool log the *actual* behavior on first run and correct this file.

## Legend
- **Login** — `Yes` = account required to submit · `No` = apply with form/resume only · `Varies` = depends on subsidiary/role
- **CAPTCHA** — `Yes` = frequent/visible · `Sometimes` = invisible reCAPTCHA v3 (common, can still flag bots) · `Varies`
- **Automation difficulty** — 🟢 Easy (no login) · 🟡 Medium (login, account once) · 🔴 Hard (login + CAPTCHA / custom portal)

---

## Quick Takeaways
- **🟢 Easiest** (Greenhouse / Lever / SmartRecruiters): Stripe, Shopify, Uber, Airbnb, Reddit, GitLab, MongoDB, Cloudflare, Coinbase, CRED, Groww, Razorpay, PhonePe, OYO, Practo, most Indian startups & edtech.
- **🟡 Medium** (Workday / SuccessFactors / Taleo majority): most enterprises — login once, then automatable.
- **🔴 Hardest** (custom portals + CAPTCHA): Amazon, Google, Apple, Meta, Microsoft, TCS, Infosys, Indian PSU/govt banks (SBI, PNB), NTPC/ONGC/IOCL, Chinese firms.

---

## Global Fortune / Large Enterprises

| Company | Career URL | ATS | Login | CAPTCHA | 
|---|---|---|---|---|
| Walmart | https://careers.walmart.com | Workday | Yes | Sometimes |
| Amazon | https://www.amazon.jobs | Amazon (custom) | Yes | Yes |
| State Grid Corp of China | http://www.sgcc.com.cn | Custom | Yes | Yes |
| Sinopec Group | http://www.sinopecgroup.com/group/en/Careers/ | Custom | Yes | Yes |
| China National Petroleum (CNPC) | https://www.cnpc.com.cn/en/jobopportunity/jobopportunity_index.shtml | Custom | Yes | Yes |
| Royal Dutch Shell | https://www.shell.com/careers.html | SuccessFactors | Yes | Sometimes |
| Apple | https://www.apple.com/careers/ | Apple (custom) | Yes | Yes |
| Saudi Aramco | https://www.aramco.com/en/careers | Custom | Yes | Sometimes |
| CVS Health | https://jobs.cvshealth.com | Workday | Yes | Sometimes |
| UnitedHealth Group | https://careers.unitedhealthgroup.com | Custom | Yes | Sometimes |
| Berkshire Hathaway | https://www.berkshirehathaway.com/careers/careers.html | Varies | Varies | Varies |
| McKesson | https://careers.mckesson.com | Workday | Yes | Sometimes |
| ExxonMobil | https://jobs.exxonmobil.com | Custom | Yes | Sometimes |
| Glencore | https://www.glencore.com/careers | SuccessFactors | Yes | Sometimes |
| Costco Wholesale | https://www.costco.com/jobs.html | Custom | Yes | Sometimes |
| Cigna | https://jobs.cigna.com | Workday | Yes | Sometimes |
| Cardinal Health | https://jobs.cardinalhealth.com | Workday | Yes | Sometimes |
| AT&T | https://www.att.jobs | Custom | Yes | Sometimes |
| AmerisourceBergen (Cencora) | https://careers.cencora.com | Workday | Yes | Sometimes |
| Verizon Communications | https://mycareer.verizon.com | Custom | Yes | Sometimes |
| The Kroger Co. | https://jobs.kroger.com | Custom | Yes | Sometimes |
| Walgreens Boots Alliance | https://jobs.walgreens.com | Custom | Yes | Sometimes |

## Automotive

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Toyota Motor | https://www.toyota.com/careers/ | Workday | Yes | Sometimes |
| Volkswagen Group | https://www.volkswagen-group.com/en/careers-15829 | SuccessFactors | Yes | Sometimes |
| BMW Group | https://www.bmwgroup.jobs/en.html | SuccessFactors | Yes | Sometimes |
| Daimler (Mercedes-Benz) | https://group.mercedes-benz.com/careers/ | SuccessFactors | Yes | Sometimes |
| Ford Motor | https://corporate.ford.com/careers.html | Workday | Yes | Sometimes |
| General Motors | https://search-careers.gm.com | Workday | Yes | Sometimes |
| Honda Motor | https://www.honda.com/careers | Workday | Yes | Sometimes |
| Tata Motors | https://www.tatamotors.com/careers/ | SuccessFactors | Yes | Sometimes |
| Mahindra & Mahindra | https://www.mahindra.com/careers | SuccessFactors | Yes | Sometimes |
| Maruti Suzuki | https://www.marutisuzuki.com/corporate/careers | Custom | Yes | Sometimes |
| Bajaj Auto | https://www.bajajauto.com/careers | Custom | Yes | Sometimes |
| Hero MotoCorp | https://www.heromotocorp.com/en-in/careers.html | SuccessFactors | Yes | Sometimes |
| TVS Motor Company | https://www.tvsmotor.com/careers | Custom | Yes | Sometimes |
| Ashok Leyland | https://www.ashokleyland.com/careers | Custom | Yes | Sometimes |
| Hyundai Motor India | https://www.hyundai.com/in/en/careers | Custom | Yes | Sometimes |
| MG Motor India | https://www.mgmotor.co.in/careers | Custom | Yes | Sometimes |
| Volvo Group | https://www.volvogroup.com/en/careers.html | Workday | Yes | Sometimes |
| Eicher Motors | https://www.eicher.in/careers | Custom | Yes | Sometimes |

## Consumer Electronics & Hardware

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Samsung Electronics | https://sec.wd3.myworkdayjobs.com/Samsung_Careers | Workday | Yes | Sometimes |
| Sony Group | https://www.sony.com/en/SonyInfo/Careers/ | Custom | Yes | Sometimes |
| LG Electronics | https://www.lg.com/global/careers | Custom | Yes | Sometimes |
| Panasonic | https://www.panasonic.com/global/corporate/careers.html | Workday | Yes | Sometimes |
| Hitachi | https://www.hitachi.com/recruit/ | Custom | Yes | Sometimes |
| Dell Technologies | https://jobs.dell.com | Workday | Yes | Sometimes |
| HP Inc. | https://jobs.hp.com | Workday | Yes | Sometimes |
| HPE | https://careers.hpe.com | Custom | Yes | Sometimes |
| Lenovo / Motorola | https://jobs.lenovo.com | Workday | Yes | Sometimes |
| ASUS | https://www.asus.com/careers/ | Custom | Yes | Sometimes |
| Acer | https://www.acer.com/careers | Custom | Yes | Sometimes |
| MSI | https://www.msi.com/about/careers | Custom | Yes | Sometimes |
| Oppo | https://careers.oppo.com | Custom | Yes | Yes |
| Vivo | https://www.vivo.com/en/about-vivo/careers | Custom | Yes | Yes |
| Realme | https://www.realme.com/in/about-careers | Custom | Yes | Yes |
| OnePlus | https://www.oneplus.com/careers | Custom | Yes | Yes |

## Big Tech / Software / Internet

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Alphabet (Google) | https://www.google.com/about/careers/applications/ | Google (custom) | Yes | Yes |
| Meta (Facebook) | https://www.metacareers.com | Meta (custom) | Yes | Yes |
| Microsoft / LinkedIn | https://careers.microsoft.com | Microsoft (custom) | Yes | Yes |
| GitHub (Microsoft) | https://github.com/about/careers | Microsoft (custom) | Yes | Yes |
| Adobe | https://careers.adobe.com | Workday | Yes | Sometimes |
| Salesforce | https://careers.salesforce.com | Workday | Yes | Sometimes |
| Oracle | https://careers.oracle.com | Oracle Recruiting | Yes | Sometimes |
| SAP | https://jobs.sap.com | SuccessFactors | Yes | Sometimes |
| ServiceNow | https://careers.servicenow.com | Workday | Yes | Sometimes |
| Cisco Systems | https://jobs.cisco.com | Custom | Yes | Sometimes |
| VMware (Broadcom) | https://www.vmware.com/company/careers.html | Workday | Yes | Sometimes |
| Intel | https://jobs.intel.com | Workday | Yes | Sometimes |
| NVIDIA | https://www.nvidia.com/en-us/about-nvidia/careers/ | Workday | Yes | Sometimes |
| Zoom | https://careers.zoom.us | Workday | Yes | Sometimes |
| Stripe | https://stripe.com/jobs | Greenhouse | No | Sometimes |
| Shopify | https://www.shopify.com/careers | Greenhouse | No | Sometimes |
| Block (Square) | https://block.xyz/careers | SmartRecruiters | No | Sometimes |
| PayPal | https://careers.pypl.com | Workday | Yes | Sometimes |
| Uber | https://www.uber.com/us/en/careers/ | Greenhouse | No | Sometimes |
| Lyft | https://www.lyft.com/careers | Greenhouse | No | Sometimes |
| Airbnb | https://careers.airbnb.com | Greenhouse | No | Sometimes |
| Booking Holdings | https://careers.bookingholdings.com | Workday | Yes | Sometimes |
| Expedia Group | https://careers.expediagroup.com | Workday | Yes | Sometimes |
| Reddit | https://www.redditinc.com/careers | Greenhouse | No | Sometimes |
| Quora | https://www.quora.com/careers | Greenhouse | No | Sometimes |
| Stack Overflow | https://stackoverflow.co/company/work-here/ | Greenhouse | No | Sometimes |
| Atlassian | https://www.atlassian.com/company/careers | SmartRecruiters | No | Sometimes |
| GitLab | https://about.gitlab.com/jobs/ | Greenhouse | No | Sometimes |
| Twitter (X) | https://careers.x.com | Custom | Yes | Sometimes |

## Chinese Tech Giants

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Huawei | https://career.huawei.com | Custom | Yes | Yes |
| Alibaba Group | https://talent.alibaba.com/off-campus | Custom | Yes | Yes |
| Tencent | https://careers.tencent.com/en-us/home.html | Custom | Yes | Yes |
| Baidu | https://talent.baidu.com | Custom | Yes | Yes |
| JD.com | https://about.jd.com/careers/ | Custom | Yes | Yes |
| Meituan | https://zhaopin.meituan.com | Custom | Yes | Yes |
| Xiaomi | https://hr.xiaomi.com | Custom | Yes | Yes |
| ByteDance | https://jobs.bytedance.com | Custom | Yes | Yes |

## IT Services & Consulting

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Accenture | https://www.accenture.com/us-en/careers | Custom | Yes | Sometimes |
| Capgemini | https://www.capgemini.com/careers/ | Workday | Yes | Sometimes |
| Cognizant | https://careers.cognizant.com | Workday | Yes | Sometimes |
| TCS | https://www.tcs.com/careers | Custom (NextStep) | Yes | Yes |
| Infosys | https://www.infosys.com/careers/ | Custom | Yes | Yes |
| Wipro | https://careers.wipro.com | Workday | Yes | Sometimes |
| HCLTech | https://www.hcltech.com/careers | SuccessFactors | Yes | Sometimes |
| Tech Mahindra | https://careers.techmahindra.com | Custom | Yes | Sometimes |
| LTIMindtree | https://www.ltimindtree.com/careers/ | Custom | Yes | Sometimes |
| Mphasis | https://careers.mphasis.com | Custom | Yes | Sometimes |
| Persistent Systems | https://www.persistent.com/careers/ | Custom | Yes | Sometimes |
| IBM | https://www.ibm.com/careers | IBM (Avature) | Yes | Sometimes |
| NTT DATA | https://careers.nttdata.com | Workday | Yes | Sometimes |
| Fujitsu | https://www.fujitsu.com/global/about/careers/ | Workday | Yes | Sometimes |
| DXC Technology | https://careers.dxc.com | Avature | Yes | Sometimes |
| Samsung SDS | https://www.samsungsds.com/us/about-careers/careers.html | Custom | Yes | Sometimes |
| ThoughtWorks | https://www.thoughtworks.com/careers | Lever | No | Sometimes |
| L&T Technology Services | https://www.ltts.com/careers | Custom | Yes | Sometimes |
| Tata Elxsi | https://www.tataelxsi.com/careers | Custom | Yes | Sometimes |

## Data / Cloud / Infra / Semiconductors

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Snowflake | https://careers.snowflake.com | Custom | Yes | Sometimes |
| Databricks | https://www.databricks.com/company/careers | Greenhouse | No | Sometimes |
| MongoDB | https://www.mongodb.com/careers | Greenhouse | No | Sometimes |
| Confluent | https://careers.confluent.io | Greenhouse | No | Sometimes |
| Elastic | https://www.elastic.co/careers | Greenhouse | No | Sometimes |
| Cloudera | https://www.cloudera.com/about/careers.html | Workday | Yes | Sometimes |
| DataRobot | https://www.datarobot.com/careers/ | Greenhouse | No | Sometimes |
| Alteryx | https://www.alteryx.com/about-us/careers | Workday | Yes | Sometimes |
| SAS Institute | https://www.sas.com/en_us/careers.html | Custom | Yes | Sometimes |
| Teradata | https://careers.teradata.com | Workday | Yes | Sometimes |
| MicroStrategy (Strategy) | https://www.strategy.com/careers | Greenhouse | No | Sometimes |
| Palantir | https://www.palantir.com/careers/ | Lever | No | Sometimes |
| Splunk (Cisco) | https://www.splunk.com/en_us/careers.html | Custom | Yes | Sometimes |
| Cloudflare | https://www.cloudflare.com/careers/ | Greenhouse | No | Sometimes |
| Fastly | https://www.fastly.com/about/careers | Greenhouse | No | Sometimes |
| Akamai | https://www.akamai.com/careers | Custom | Yes | Sometimes |
| Nutanix | https://www.nutanix.com/company/careers | Workday | Yes | Sometimes |
| NetApp | https://www.netapp.com/company/careers/ | Workday | Yes | Sometimes |
| Pure Storage | https://www.purestorage.com/company/careers.html | Greenhouse | No | Sometimes |
| Western Digital | https://jobs.westerndigital.com | Workday | Yes | Sometimes |
| Seagate | https://www.seagate.com/careers/ | Workday | Yes | Sometimes |
| Micron | https://www.micron.com/careers | Workday | Yes | Sometimes |
| SK Hynix | https://careers.skhynix.com | Custom | Yes | Sometimes |
| Qualcomm | https://www.qualcomm.com/company/careers | Workday | Yes | Sometimes |
| ARM | https://careers.arm.com | Workday | Yes | Sometimes |
| Broadcom | https://www.broadcom.com/company/careers | Workday | Yes | Sometimes |
| Marvell | https://www.marvell.com/company/careers.html | Workday | Yes | Sometimes |
| Xilinx (AMD) | https://careers.amd.com | Workday | Yes | Sometimes |
| Texas Instruments | https://careers.ti.com | Custom | Yes | Sometimes |
| Analog Devices | https://www.analog.com/en/about-adi/careers.html | Workday | Yes | Sometimes |
| Red Hat (IBM) | https://www.redhat.com/en/jobs | Workday | Yes | Sometimes |
| Canonical | https://canonical.com/careers | Greenhouse | No | Sometimes |

## Indian Conglomerates & Manufacturing

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Reliance Industries | https://careers.ril.com | SuccessFactors | Yes | Sometimes |
| Reliance Retail | https://relianceretail.com/careers.html | SuccessFactors | Yes | Sometimes |
| Jio Platforms | https://careers.jio.com | Custom | Yes | Sometimes |
| Tata Group | https://www.tata.com/careers | Varies | Varies | Varies |
| Tata Steel | https://www.tatasteel.com/careers/ | SuccessFactors | Yes | Sometimes |
| Tata Power | https://www.tatapower.com/careers/overview.aspx | Custom | Yes | Sometimes |
| Tata Consumer Products | https://www.tataconsumer.com/careers | SuccessFactors | Yes | Sometimes |
| Tata Communications | https://www.tatacommunications.com/careers/ | Custom | Yes | Sometimes |
| Larsen & Toubro (L&T) | https://www.larsentoubro.com/corporate/careers/ | SuccessFactors | Yes | Sometimes |
| Adani Group | https://www.adani.com/careers | SuccessFactors | Yes | Sometimes |
| Adani Ports | https://www.adaniports.com/Careers | SuccessFactors | Yes | Sometimes |
| Adani Enterprises | https://www.adanienterprises.com/careers | SuccessFactors | Yes | Sometimes |
| Adani Green Energy | https://www.adanigreenenergy.com/careers | SuccessFactors | Yes | Sometimes |
| JSW Steel | https://www.jsw.in/careers | SuccessFactors | Yes | Sometimes |
| Jindal Steel & Power | https://www.jindalsteelpower.com/careers.html | Custom | Yes | Sometimes |
| Vedanta | https://www.vedantalimited.com/eng/careers.php | SuccessFactors | Yes | Sometimes |
| Hindalco | https://www.hindalco.com/careers | SuccessFactors | Yes | Sometimes |
| Godrej Group | https://www.godrej.com/careers | SuccessFactors | Yes | Sometimes |
| Siemens | https://jobs.siemens.com | Avature | Yes | Sometimes |
| ABB India | https://careers.abb | Custom | Yes | Sometimes |
| Schneider Electric | https://www.se.com/in/en/about-us/careers/ | SuccessFactors | Yes | Sometimes |
| Honeywell | https://careers.honeywell.com | Workday | Yes | Sometimes |
| 3M | https://www.3m.com/3M/en_US/careers-us/ | Workday | Yes | Sometimes |
| Bosch | https://www.bosch.in/careers/ | SuccessFactors | Yes | Sometimes |
| Cummins | https://www.cummins.com/careers | Custom | Yes | Sometimes |
| Saint-Gobain | https://www.saint-gobain.co.in/careers | SuccessFactors | Yes | Sometimes |

## Indian PSU / Government (login + CAPTCHA, exam-based)

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| NTPC | https://careers.ntpc.co.in | Custom (PSU) | Yes | Yes |
| ONGC | https://ongcindia.com/web/eng/career | Custom (PSU) | Yes | Yes |
| Indian Oil (IOCL) | https://iocl.com/latest-job-openings | Custom (PSU) | Yes | Yes |
| Bharat Petroleum (BPCL) | https://www.bharatpetroleum.in/bpcl-and-beyond/careers/careers.aspx | Custom (PSU) | Yes | Yes |
| GAIL (India) | https://gailonline.com/CRGIRecruitment.html | Custom (PSU) | Yes | Yes |
| Power Grid Corp | https://www.powergrid.in/en/careers | Custom (PSU) | Yes | Yes |
| BHEL | https://careers.bhel.in | Custom (PSU) | Yes | Yes |
| Indian Railways (RRB) | https://www.rrbcdg.gov.in | Custom (govt) | Yes | Yes |

## Banking & Financial Services

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Kotak Mahindra Bank | https://www.kotak.com/en/careers.html | SuccessFactors | Yes | Sometimes |
| HDFC Bank | https://www.hdfcbank.com/personal/about-us/careers | Custom | Yes | Sometimes |
| ICICI Bank | https://www.icicicareers.com | Custom | Yes | Sometimes |
| State Bank of India (SBI) | https://sbi.co.in/web/careers | Custom (govt) | Yes | Yes |
| Axis Bank | https://www.axisbank.com/careers | SuccessFactors | Yes | Sometimes |
| IndusInd Bank | https://www.indusind.com/in/en/personal/careers.html | Custom | Yes | Sometimes |
| Yes Bank | https://www.yesbank.in/careers | Custom | Yes | Sometimes |
| Bank of Baroda | https://www.bankofbaroda.in/career | Custom (govt) | Yes | Yes |
| Punjab National Bank | https://www.pnbindia.in/recruitments.html | Custom (govt) | Yes | Yes |
| Canara Bank | https://canarabank.com/careers | Custom (govt) | Yes | Yes |
| IDFC First Bank | https://www.idfcfirstbank.com/careers | Custom | Yes | Sometimes |
| Standard Chartered | https://www.sc.com/en/careers/ | Workday | Yes | Sometimes |
| HSBC | https://www.hsbc.com/careers | Workday | Yes | Sometimes |
| Citibank | https://jobs.citi.com | Custom | Yes | Sometimes |
| JPMorgan Chase | https://careers.jpmorgan.com | Oracle/Custom | Yes | Sometimes |
| Bank of America | https://careers.bankofamerica.com | Workday | Yes | Sometimes |
| Wells Fargo | https://www.wellsfargojobs.com | Custom | Yes | Sometimes |
| Goldman Sachs | https://www.goldmansachs.com/careers/ | Custom | Yes | Sometimes |
| Morgan Stanley | https://www.morganstanley.com/careers | Workday | Yes | Sometimes |
| UBS (incl. Credit Suisse) | https://www.ubs.com/global/en/careers.html | Avature | Yes | Sometimes |
| Barclays | https://search.jobs.barclays | Custom | Yes | Sometimes |
| Deutsche Bank | https://careers.db.com | Avature | Yes | Sometimes |
| BNP Paribas | https://group.bnpparibas/en/careers | SmartRecruiters | No | Sometimes |
| Societe Generale | https://careers.societegenerale.com | Custom | Yes | Sometimes |
| Nomura | https://www.nomura.com/careers/ | Workday | Yes | Sometimes |
| Bajaj Finserv | https://www.bajajfinserv.in/careers | Custom | Yes | Sometimes |
| HDFC Life | https://www.hdfclife.com/about-us/careers | Custom | Yes | Sometimes |
| Kotak Life | https://www.kotaklife.com/careers | SuccessFactors | Yes | Sometimes |
| Muthoot Finance | https://www.muthootfinance.com/careers | Custom | Yes | Sometimes |
| Shriram Finance | https://www.shriramfinance.in/careers | Custom | Yes | Sometimes |
| Mahindra Finance | https://www.mahindrafinance.com/careers | SuccessFactors | Yes | Sometimes |
| Mastercard | https://careers.mastercard.com | Workday | Yes | Sometimes |
| Visa | https://corporate.visa.com/en/jobs.html | Custom | Yes | Sometimes |
| American Express | https://www.americanexpress.com/en-us/careers/ | Custom | Yes | Sometimes |
| Discover | https://jobs.discover.com | Workday | Yes | Sometimes |
| FIS Global | https://careers.fisglobal.com | Workday | Yes | Sometimes |
| Fidelity Investments | https://jobs.fidelity.com | Custom | Yes | Sometimes |
| BlackRock | https://careers.blackrock.com | Workday | Yes | Sometimes |
| Vanguard | https://www.vanguardjobs.com | Custom | Yes | Sometimes |
| State Street | https://careers.statestreet.com | Workday | Yes | Sometimes |
| T. Rowe Price | https://www.troweprice.com/corporate/us/en/careers.html | Workday | Yes | Sometimes |

## Fintech & Crypto (India + Global)

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Paytm | https://paytm.com/careers | Custom | No | Sometimes |
| PhonePe | https://www.phonepe.com/careers/ | Greenhouse | No | Sometimes |
| Razorpay | https://razorpay.com/jobs/ | Greenhouse | No | Sometimes |
| PolicyBazaar | https://www.policybazaar.com/careers/ | Custom | No | Sometimes |
| CRED | https://careers.cred.club | Lever | No | Sometimes |
| Groww | https://groww.in/careers | Lever | No | Sometimes |
| Zerodha | https://zerodha.com/careers/ | Custom | No | Sometimes |
| Upstox | https://upstox.com/careers/ | Lever | No | Sometimes |
| Angel One | https://www.angelone.in/careers | Custom | No | Sometimes |
| Coinbase | https://www.coinbase.com/careers | Greenhouse | No | Sometimes |
| Binance | https://www.binance.com/en/careers | Custom | No | Yes |
| WazirX | https://wazirx.com/careers | Lever | No | Sometimes |
| CoinDCX | https://careers.coindcx.com | Lever | No | Sometimes |

## FMCG / Consumer Goods

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Nestle | https://www.nestle.com/jobs | SuccessFactors | Yes | Sometimes |
| Procter & Gamble | https://www.pgcareers.com | Custom | Yes | Yes |
| PepsiCo | https://www.pepsicojobs.com | Custom | Yes | Sometimes |
| Coca-Cola | https://careers.coca-colacompany.com | Workday | Yes | Sometimes |
| LVMH | https://www.lvmh.com/join-us/ | SmartRecruiters | No | Sometimes |
| Hindustan Unilever (HUL) | https://www.hul.co.in/careers/ | Workday | Yes | Sometimes |
| ITC Limited | https://www.itcportal.com/careers/ | Custom | Yes | Sometimes |
| Britannia | https://www.britannia.co.in/careers | Custom | Yes | Sometimes |
| Dabur | https://www.dabur.com/careers | SuccessFactors | Yes | Sometimes |
| Marico | https://marico.com/india/careers | SuccessFactors | Yes | Sometimes |
| Emami | https://www.emamiltd.in/careers/ | Custom | Yes | Sometimes |
| Colgate-Palmolive | https://jobs.colgate.com | Workday | Yes | Sometimes |
| Godrej Consumer Products | https://www.godrejcp.com/careers | SuccessFactors | Yes | Sometimes |

## Pharma & Healthcare (Companies)

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Novartis | https://www.novartis.com/careers | Workday | Yes | Sometimes |
| Pfizer | https://www.pfizer.com/about/careers | Workday | Yes | Sometimes |
| Roche | https://careers.roche.com | Avature | Yes | Sometimes |
| Merck & Co. | https://jobs.merck.com | Phenom/Custom | Yes | Sometimes |
| Abbott | https://www.jobs.abbott | Workday | Yes | Sometimes |
| Johnson & Johnson | https://www.careers.jnj.com | Workday | Yes | Sometimes |
| GlaxoSmithKline (GSK) | https://www.gsk.com/en-gb/careers/ | Workday | Yes | Sometimes |
| Sanofi | https://www.sanofi.com/en/careers | Workday | Yes | Sometimes |
| AstraZeneca | https://careers.astrazeneca.com | Workday | Yes | Sometimes |
| Bristol-Myers Squibb | https://careers.bms.com | Workday | Yes | Sometimes |
| Eli Lilly | https://careers.lilly.com | Workday | Yes | Sometimes |
| AbbVie | https://careers.abbvie.com | Workday | Yes | Sometimes |
| Takeda | https://www.takedajobs.com | Workday | Yes | Sometimes |
| Bayer | https://www.bayer.com/en/in/careers | Workday | Yes | Sometimes |
| Cipla | https://www.cipla.com/careers | SuccessFactors | Yes | Sometimes |
| Dr. Reddy's | https://careers.drreddys.com | SuccessFactors | Yes | Sometimes |
| Sun Pharma | https://sunpharma.com/careers/ | SuccessFactors | Yes | Sometimes |
| Lupin | https://www.lupin.com/careers/ | SuccessFactors | Yes | Sometimes |
| Aurobindo Pharma | https://www.aurobindo.com/careers/ | Custom | Yes | Sometimes |
| Biocon | https://www.biocon.com/careers/ | SuccessFactors | Yes | Sometimes |
| Torrent Pharma | https://www.torrentpharma.com/career.php | Custom | Yes | Sometimes |
| Glenmark | https://www.glenmarkpharma.com/careers | SuccessFactors | Yes | Sometimes |
| Zydus Lifesciences | https://www.zyduslife.com/careers | Custom | Yes | Sometimes |
| Alkem Laboratories | https://www.alkemlabs.com/careers.php | Custom | Yes | Sometimes |
| Wockhardt | https://www.wockhardt.com/careers/ | Custom | Yes | Sometimes |
| Mankind Pharma | https://www.mankindpharma.com/careers/ | Custom | Yes | Sometimes |
| Intas Pharma | https://www.intaspharma.com/careers/ | Custom | Yes | Sometimes |
| Serum Institute | https://www.seruminstitute.com/careers.php | Custom | Yes | Sometimes |
| Bharat Biotech | https://www.bharatbiotech.com/careers.html | Custom | Yes | Sometimes |

## Hospitals & Health Services

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Dr. Lal PathLabs | https://www.lalpathlabs.com/careers | Custom | Yes | Sometimes |
| SRL Diagnostics | https://www.srlworld.com/careers | Custom | Yes | Sometimes |
| Thyrocare | https://www.thyrocare.com/careers | Custom | Yes | Sometimes |
| Fortis Healthcare | https://www.fortishealthcare.com/careers | Custom | Yes | Sometimes |
| Apollo Hospitals | https://www.apollohospitals.com/careers/ | Custom | Yes | Sometimes |
| Max Healthcare | https://www.maxhealthcare.in/careers | Custom | Yes | Sometimes |
| Manipal Hospitals | https://www.manipalhospitals.com/careers/ | Custom | Yes | Sometimes |
| Narayana Health | https://www.narayanahealth.org/careers | Custom | Yes | Sometimes |
| Aster DM Healthcare | https://www.asterdmhealthcare.com/careers | Custom | Yes | Sometimes |
| Care Hospitals | https://www.carehospitals.com/careers/ | Custom | Yes | Sometimes |
| Medanta | https://www.medanta.org/careers | Custom | Yes | Sometimes |
| Hinduja Hospitals | https://www.hindujahospital.com/careers | Custom | Yes | Sometimes |
| Cloudnine | https://www.cloudninecare.com/careers | Custom | Yes | Sometimes |
| Kokilaben Hospital | https://www.kokilabenhospital.com/careers/careers.html | Custom | Yes | Sometimes |
| Practo | https://www.practo.com/company/careers | Lever | No | Sometimes |
| Tata 1mg | https://www.1mg.com/jobs | Custom | No | Sometimes |
| PharmEasy | https://pharmeasy.in/careers | Lever | No | Sometimes |
| Cult.fit | https://www.cure.fit/careers | Lever | No | Sometimes |

## E-commerce, Retail & Fashion

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Flipkart | https://www.flipkartcareers.com | Custom | Yes | Sometimes |
| Myntra | https://careers.myntra.com | Custom | Yes | Sometimes |
| Nykaa | https://www.nykaa.com/careers | Custom | No | Sometimes |
| Snapdeal | https://www.snapdeal.com/page/careers | Custom | No | Sometimes |
| BigBasket | https://www.bigbasket.com/careers/ | Custom | No | Sometimes |
| Ajio / Reliance Brands | https://relianceretail.com/careers.html | SuccessFactors | Yes | Sometimes |
| Aditya Birla Fashion (ABFRL) | https://abfrl.com/careers/ | SuccessFactors | Yes | Sometimes |
| Shoppers Stop | https://corporate.shoppersstop.com/careers | Custom | Yes | Sometimes |
| Trent (Tata) | https://www.trent-tata.com/careers.html | Custom | Yes | Sometimes |
| DMart (Avenue Supermarts) | https://www.dmartindia.com/careers | Custom | Yes | Sometimes |
| Spencer's Retail | https://www.spencers.in/careers | Custom | Yes | Sometimes |
| Future Group | https://www.futuregroup.in/careers | Custom | Yes | Sometimes |
| Zara (Inditex) | https://www.inditexcareers.com | Custom | Yes | Sometimes |
| H&M | https://career.hm.com | Workday | Yes | Sometimes |
| Uniqlo | https://www.uniqlo.com/in/en/company/careers.html | Custom | Yes | Sometimes |
| IKEA | https://www.ikea.com/global/en/jobs/ | SmartRecruiters | No | Sometimes |
| Levi Strauss | https://www.levistrauss.com/careers/ | Workday | Yes | Sometimes |
| Home Depot | https://careers.homedepot.com | Custom | Yes | Sometimes |
| Lowe's | https://talent.lowes.com | Workday | Yes | Sometimes |
| Best Buy | https://www.bestbuy-jobs.com | Custom | Yes | Sometimes |
| Carrefour | https://www.carrefour.com/en/group/careers | Custom | Yes | Sometimes |
| Tesco | https://www.tesco-careers.com | Custom | Yes | Sometimes |
| Sainsbury's | https://sainsburys.jobs | Custom | Yes | Sometimes |
| Aldi | https://careers.aldi.com | Custom | Yes | Sometimes |
| Lidl | https://careers.lidl.com | SuccessFactors | Yes | Sometimes |
| Woolworths | https://www.wowcareers.com.au | Custom | Yes | Sometimes |
| Metro AG | https://www.metroag.de/en/career | SuccessFactors | Yes | Sometimes |
| Marks & Spencer | https://jobs.marksandspencer.com | Workday | Yes | Sometimes |
| Staples | https://careers.staples.com | Workday | Yes | Sometimes |
| Office Depot | https://jobs.officedepot.com | Workday | Yes | Sometimes |
| Ralph Lauren | https://www.ralphlauren.com/rl-careers | Workday | Yes | Sometimes |

## Sportswear & Appliances

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Nike | https://jobs.nike.com | Custom | Yes | Sometimes |
| Adidas | https://careers.adidas-group.com | Custom | Yes | Sometimes |
| Puma | https://about.puma.com/en/careers | SuccessFactors | Yes | Sometimes |
| Under Armour | https://careers.underarmour.com | Workday | Yes | Sometimes |
| VF Corporation | https://www.vfc.com/careers | Workday | Yes | Sometimes |
| Skechers | https://www.skechers.com/careers/ | Workday | Yes | Sometimes |
| New Balance | https://jobs.newbalance.com | Workday | Yes | Sometimes |
| Asics | https://corp.asics.com/en/careers | Custom | Yes | Sometimes |
| Whirlpool | https://www.whirlpoolcareers.com | Workday | Yes | Sometimes |
| Voltas | https://www.voltas.com/careers | Custom | Yes | Sometimes |
| Blue Star | https://www.bluestarindia.com/careers.aspx | Custom | Yes | Sometimes |
| Bajaj Electricals | https://www.bajajelectricals.com/careers | Custom | Yes | Sometimes |
| Daikin India | https://www.daikinindia.com/careers | Custom | Yes | Sometimes |
| Philips | https://www.careers.philips.com | Workday | Yes | Sometimes |
| Johnson Controls | https://www.johnsoncontrols.com/careers | Workday | Yes | Sometimes |

## Logistics & Courier

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Blue Dart | https://www.bluedart.com/careers | Custom | Yes | Sometimes |
| DHL Express | https://careers.dhl.com | SuccessFactors | Yes | Sometimes |
| FedEx | https://careers.fedex.com | Custom | Yes | Sometimes |
| UPS | https://www.jobs-ups.com | Custom | Yes | Sometimes |
| Delhivery | https://www.delhivery.com/careers/ | Custom | No | Sometimes |
| DTDC | https://www.dtdc.in/careers.asp | Custom | Yes | Sometimes |
| XpressBees | https://www.xpressbees.com/careers | Custom | No | Sometimes |
| Ecom Express | https://www.ecomexpress.in/careers/ | Custom | No | Sometimes |
| Mahindra Logistics | https://mahindralogistics.com/careers/ | SuccessFactors | Yes | Sometimes |
| Kuehne + Nagel | https://home.kuehne-nagel.com/careers | SuccessFactors | Yes | Sometimes |
| DB Schenker | https://www.dbschenker.com/global/careers | SuccessFactors | Yes | Sometimes |
| CEVA Logistics | https://www.cevalogistics.com/en/careers | SuccessFactors | Yes | Sometimes |
| Aramex | https://www.aramex.com/careers | SuccessFactors | Yes | Sometimes |
| SF Express | https://www.sf-express.com/careers | Custom | Yes | Yes |

## Aviation & Travel

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Air India | https://www.airindia.com/in/en/about-us/careers.html | Custom | Yes | Sometimes |
| IndiGo | https://careers.goindigo.in | Custom | Yes | Sometimes |
| SpiceJet | https://www.spicejet.com/Careers.aspx | Custom | Yes | Sometimes |
| Akasa Air | https://www.akasaair.com/careers | Custom | Yes | Sometimes |
| Emirates | https://www.emiratesgroupcareers.com | Custom | Yes | Sometimes |
| Qatar Airways | https://careers.qatarairways.com | SuccessFactors | Yes | Sometimes |
| Etihad Airways | https://careers.etihad.com | SuccessFactors | Yes | Sometimes |
| British Airways | https://careers.ba.com | Custom | Yes | Sometimes |
| Lufthansa | https://www.be-lufthansa.com/en/ | Custom | Yes | Sometimes |
| Air France-KLM | https://recrutement.airfrance.com/en | Custom | Yes | Sometimes |
| Delta Air Lines | https://www.delta.com/us/en/careers/overview | Custom | Yes | Sometimes |
| American Airlines | https://jobs.aa.com | Custom | Yes | Sometimes |
| United Airlines | https://careers.united.com | Custom | Yes | Sometimes |
| Southwest Airlines | https://careers.southwestair.com | Custom | Yes | Sometimes |
| Singapore Airlines | https://www.singaporeair.com/en_UK/careers/ | Custom | Yes | Sometimes |
| Cathay Pacific | https://careers.cathaypacific.com | Custom | Yes | Sometimes |
| MakeMyTrip / Goibibo | https://careers.makemytrip.com | Custom | No | Sometimes |
| Cleartrip | https://www.cleartrip.com/careers | Lever | No | Sometimes |
| Yatra.com | https://www.yatra.com/corporate/careers | Custom | Yes | Sometimes |
| Booking.com | https://careers.booking.com | Workday | Yes | Sometimes |
| OYO Rooms | https://www.oyorooms.com/careers/ | Lever | No | Sometimes |
| Treebo Hotels | https://www.treebo.com/careers | Custom | No | Sometimes |
| FabHotels | https://www.fabhotels.com/careers.html | Custom | No | Sometimes |

## Hotels

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Marriott | https://careers.marriott.com | Custom | Yes | Sometimes |
| Hilton | https://jobs.hilton.com | Workday | Yes | Sometimes |
| Hyatt | https://careers.hyatt.com | Workday | Yes | Sometimes |
| Accor | https://careers.accor.com | SmartRecruiters | No | Sometimes |
| Taj Hotels (IHCL) | https://www.ihcltata.com/careers/ | SuccessFactors | Yes | Sometimes |
| Oberoi Hotels | https://www.oberoihotels.com/careers/ | Custom | Yes | Sometimes |
| ITC Hotels | https://www.itchotels.com/in/en/careers | Custom | Yes | Sometimes |
| Lemon Tree Hotels | https://www.lemontreehotels.com/careers | Custom | Yes | Sometimes |
| IHG | https://careers.ihg.com | Workday | Yes | Sometimes |
| Radisson | https://careers.radissonhotels.com | SuccessFactors | Yes | Sometimes |

## EdTech & Education

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Byju's | https://byjus.com/careers/ | Custom | No | Sometimes |
| Unacademy | https://unacademy.com/careers | Lever | No | Sometimes |
| Vedantu | https://www.vedantu.com/careers | Custom | No | Sometimes |
| Toppr | https://www.toppr.com/careers/ | Custom | No | Sometimes |
| Simplilearn | https://www.simplilearn.com/careers | Custom | No | Sometimes |
| upGrad | https://www.upgrad.com/careers/ | Lever | No | Sometimes |
| Coursera | https://about.coursera.org/careers | Greenhouse | No | Sometimes |
| Udemy | https://about.udemy.com/careers/ | Greenhouse | No | Sometimes |
| Khan Academy | https://www.khanacademy.org/careers | Lever | No | Sometimes |
| edX | https://www.edx.org/about/careers | Custom | No | Sometimes |
| NIIT | https://www.niit.com/india/careers | Custom | Yes | Sometimes |
| Aptech | https://www.aptech-worldwide.com/careers | Custom | Yes | Sometimes |
| Edureka | https://www.edureka.co/careers | Custom | No | Sometimes |
| Great Learning | https://www.mygreatlearning.com/careers | Custom | No | Sometimes |
| Shiksha (Info Edge) | https://www.infoedge.in/careers.php | Custom | No | Sometimes |
| Careers360 | https://www.careers360.com/about-us/careers | Custom | No | Sometimes |
| Meritnation | https://www.meritnation.com/careers | Custom | No | Sometimes |
| Extramarks | https://www.extramarks.com/careers | Custom | No | Sometimes |

## Food Delivery & Mobility (India)

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Zomato | https://www.zomato.com/careers | Custom | No | Sometimes |
| Swiggy | https://careers.swiggy.com | Custom | No | Sometimes |
| Ola Cabs | https://www.olacabs.com/careers | Custom | Yes | Sometimes |

## BPO / Outsourcing

| Company | Career URL | ATS | Login | CAPTCHA |
|---|---|---|---|---|
| Genpact | https://www.genpact.com/careers | Custom | Yes | Sometimes |
| EXL Service | https://www.exlservice.com/careers | Custom | Yes | Sometimes |
| WNS Global | https://www.wns.com/careers | Custom | Yes | Sometimes |
| Firstsource | https://www.firstsource.com/careers/ | Custom | Yes | Sometimes |
| Concentrix | https://careers.concentrix.com | Custom | Yes | Sometimes |
| Teleperformance | https://www.teleperformance.com/en-us/careers/ | Custom | Yes | Sometimes |
| Sutherland | https://www.sutherlandglobal.com/careers | Custom | Yes | Sometimes |
| Alorica | https://www.alorica.com/careers | Custom | Yes | Sometimes |
| HGS (Hinduja) | https://www.teamhgs.com/careers | Custom | Yes | Sometimes |
| Capita | https://www.capita.com/careers | Custom | Yes | Sometimes |

---

*Generated for the autoresumeapply project. Verify ATS/CAPTCHA on first automated run and update this file with observed values.*
