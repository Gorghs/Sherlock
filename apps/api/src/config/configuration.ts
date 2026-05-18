/**
 * Central configuration factory.
 * Maps every environment variable to a typed config object.
 */
export default () => {
  const parseBool = (val: string | undefined, fallback: boolean): boolean => {
    if (val === undefined || val === '') return fallback;
    return ['true', '1', 'yes', 'on'].includes(val.toLowerCase());
  };

  const parseList = (val: string | undefined): string[] => {
    if (!val || val.trim() === '') return [];
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const parseInt = (val: string | undefined, fallback: number): number => {
    if (val === undefined || val === '') return fallback;
    const n = Number(val);
    return Number.isNaN(n) ? fallback : n;
  };

  return {
    port: parseInt(process.env.PORT, 3001),

    // API Security
    auth: {
      enabled: parseBool(process.env.ENABLE_API_KEY_AUTH, false),
      apiKeys: parseList(process.env.API_KEYS),
      headerName: process.env.API_KEY_HEADER_NAME || 'x-api-key',
    },

    // Rate Limiting
    rateLimit: {
      enabled: parseBool(process.env.RATE_LIMIT_ENABLED, false),
      maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS, 100),
      timeframeSec: parseInt(process.env.RATE_LIMIT_TIMEFRAME, 3600),
    },

    // Proxy
    proxy: {
      defaults: parseList(process.env.DEFAULT_PROXIES),
      caCertPath: process.env.CA_CERT_PATH || null,
    },

    // Search Defaults
    defaults: {
      siteNames: parseList(
        process.env.DEFAULT_SITE_NAMES ||
          'linkedin,indeed,naukri,internshala,monster,wellfound,careerjet,adzuna,glassdoor,google,zip_recruiter,bayt,bdjobs,careerbuilder,themuse,builtin,jobicy,himalayas,remoteok,remotive,weworkremotely,startupjobs,workingnomads,techcareers,jobdataapi,authenticjobs,androidjobs,iosdevjobs,devopsjobs,clojurejobs,pythonjobs,golangjobs,railsjobs,elixirjobs,google_careers,amazon,microsoft,apple,meta,netflix,nvidia,ibm,openai,stripe,uber,zoom,tiktok,cursor,boeing,exa,upwork',
      ),
      resultsWanted: parseInt(process.env.DEFAULT_RESULTS_WANTED, 20),
      distance: parseInt(process.env.DEFAULT_DISTANCE, 50),
      descriptionFormat: process.env.DEFAULT_DESCRIPTION_FORMAT || 'markdown',
      country: process.env.DEFAULT_COUNTRY || 'USA',
    },

    // Caching
    cache: {
      enabled: parseBool(process.env.ENABLE_CACHE, false),
      expirySec: parseInt(process.env.CACHE_EXPIRY, 3600),
      redisUrl: process.env.REDIS_URL || null,
      maxItems: parseInt(process.env.CACHE_MAX_ITEMS, 500),
    },

    // Retry policies
    retry: {
      defaultRetries: parseInt(process.env.RETRY_DEFAULT_RETRIES, 3),
      defaultDelayMs: parseInt(process.env.RETRY_DEFAULT_DELAY_MS, 1000),
      defaultBackoff: process.env.RETRY_DEFAULT_BACKOFF || 'linear',
      perSource: (() => {
        try {
          return JSON.parse(process.env.RETRY_PER_SOURCE || '{}');
        } catch {
          return {};
        }
      })(),
    },

    // GraphQL
    graphql: {
      enabled: parseBool(process.env.ENABLE_GRAPHQL, true),
      playground: parseBool(process.env.GRAPHQL_PLAYGROUND, true),
      path: process.env.GRAPHQL_PATH || 'graphql',
    },

    // Prometheus Metrics
    metrics: {
      enabled: parseBool(process.env.ENABLE_METRICS, true),
    },

    // Plugins
    plugins: {
      enabled: parseBool(process.env.ENABLE_PLUGINS, false),
      dir: process.env.PLUGINS_DIR || null,
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development',

    // CORS
    cors: {
      origins: parseList(process.env.CORS_ORIGINS || '*'),
    },

    // Swagger
    swagger: {
      enabled: parseBool(process.env.ENABLE_SWAGGER, true),
      path: process.env.SWAGGER_PATH || 'swg',
    },

    // Scalar
    scalar: {
      enabled: parseBool(process.env.ENABLE_SCALAR, true),
      path: process.env.SCALAR_PATH || 'docs',
    },

    // Telegram Notifications
    telegram: {
      enabled: parseBool(process.env.NOTIFY_TELEGRAM_ENABLED, true),
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
    },

    // Gemini AI
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    },

    // Job Scheduler
    scheduler: {
      enabled: parseBool(process.env.SCHEDULER_ENABLED, false),
      time: process.env.SCHEDULER_TIME || '09:00',
    },

    // Job Filter
    filter: {
      techKeywords: process.env.FILTER_TECH_KEYWORDS || '',
      freshersOnly: parseBool(process.env.FILTER_FRESHERS_ONLY, true),
      minRelevanceScore: parseInt(process.env.FILTER_MIN_RELEVANCE_SCORE, 40),
      indiaOfficeOnly: parseBool(process.env.FILTER_INDIA_OFFICE_ONLY, true),
      allowRemote: parseBool(process.env.FILTER_ALLOW_REMOTE, true),
      allowHybrid: parseBool(process.env.FILTER_ALLOW_HYBRID, true),
      requireApplyLink: parseBool(process.env.FILTER_REQUIRE_APPLY_LINK, true),
      maxResultsPerDay: parseInt(process.env.FILTER_MAX_RESULTS_PER_DAY, 50),
    },

    // Priority Ranking
    priority: {
      companySiteNames: parseList(
        process.env.PRIORITY_COMPANY_SITE_NAMES ||
          'google_careers,amazon,microsoft,apple,meta,netflix,nvidia,ibm,openai,stripe,uber,zoom,tiktok,cursor,boeing',
      ),
      companyCareerDomains: parseList(
        process.env.PRIORITY_COMPANY_CAREER_DOMAINS ||
          'tcs.com,infosys.com,wipro.com,hcltech.com,techmahindra.com,ltimindtree.com,mphasis.com,persistent.com,cyient.com,hexaware.com,zensar.com,birlasoft.com,coforge.com,lntinfotech.com,sonata-software.com,accenture.com,capgemini.com,cognizant.com,ibm.com,deloitte.com,ey.com,pwc.in,kpmg.com,cgi.com,dxc.com,genpact.com,wns.com,conduent.com,nttdata.com,atos.net,google.com,microsoft.com,amazon.jobs,metacareers.com,apple.com,jobs.netflix.com,careers.linkedin.com,careers.twitter.com,adobe.com,salesforce.com,oracle.com,jobs.sap.com,vmware.com,jobs.cisco.com,jobs.intel.com,razorpay.com,paytm.com,phonepe.com,careers.cred.club,bharatpe.com,flipkartcareers.com,olacabs.com,careers.swiggy.com,zomato.com,udaan.com,dream11.com,mpl.live,meesho.com,unacademy.com,zerodha.com,blinkit.com,dunzo.com,lenskart.com,nykaa.com,myntra.com,bigbasket.com,urbancompany.com,shopify.com,etsy.com,wayfair.com,zoho.com,freshworks.com,chargebee.com,clevertap.com,postman.com,browserstack.com,inmobi.com,rockstargames.com,ubisoft.com,ea.com,zynga.com,spotifyjobs.com,uber.com,rapido.bike,blusmart.com,bounce.co,practo.com,1mg.com,pharmeasy.in,netmeds.com,healthifyme.com,upgrad.com,vedantu.com,simplilearn.com,greatlearning.in,eruditus.com,scaler.com,pw.live,qualcomm.com,nvidia.com,broadcom.com,careers.ti.com,jobs.micron.com,amd.com,mediatek.com,arm.com,careers.jio.com,careers.airtel.in,myvi.in,nokia.com,ericsson.com,samsung.com,tesla.com,olaelectric.com,atherenergy.com,bosch.in,continental.com,fractal.ai,latentview.com,tigeranalytics.com,microsoft.com,research.google,research.ibm.com,research.adobe.com,thoughtworks.com,globant.com,epam.com,endava.com,virtusa.com,synechron.com,publicissapient.com,nagarro.com,tothenew.com,nielsen.com,kantar.com,jobs.iqvia.com,mckinsey.com,careers.bcg.com,careers.infosys.com,careers.wipro.com,careers.tcs.com,careers.hcltech.com,careers.techmahindra.com,careers.ltimindtree.com,careers.zoho.com,careers.freshworks.com,careers.postman.com,careers.browserstack.com,careers.inmobi.com,careers.razorpay.com,careers.paytm.com,careers.phonepe.com,careers.meesho.com,careers.nykaa.com,careers.myntra.com,careers.bigbasket.com,careers.urbancompany.com,careers.olaelectric.com,careers.atherenergy.com',
      ),
    },

    // Meta discovery for sites without dedicated plugins
    discovery: {
      enabled: parseBool(process.env.DISCOVERY_ENABLED, true),
      querySources: parseList(
        process.env.DISCOVERY_QUERY_SOURCES ||
          'google,exa,naukri,internshala,linkedin,indeed,wellfound,himalayas,jobicy,remoteok,remotive,weworkremotely,workingnomads,startupjobs',
      ),
      domainsPerRun: parseInt(process.env.DISCOVERY_DOMAINS_PER_RUN, 180),
      domainsPerQuery: parseInt(process.env.DISCOVERY_DOMAINS_PER_QUERY, 6),
      maxParallelQueries: parseInt(process.env.DISCOVERY_MAX_PARALLEL_QUERIES, 4),
      portalDomains: parseList(
        process.env.DISCOVERY_PORTAL_DOMAINS ||
          'linkedin.com,indeed.com,naukri.com,foundit.in,timesjobs.com,shine.com,freshersworld.com,internshala.com,cutshort.io,instahyre.com,wellfound.com,jora.com,careerjet.co.in,jobisjob.co.in,mitula.in,apna.co,hirect.in,quikr.com,sarkariresult.com,freejobalert.com',
      ),
    },

    // Email Notifications
    email: {
      enabled: parseBool(process.env.NOTIFY_EMAIL_ENABLED, true),
      gmailUser: process.env.EMAIL_GMAIL_USER || '',
      gmailPassword: process.env.EMAIL_GMAIL_PASSWORD || '',
      recipientEmail: process.env.EMAIL_RECIPIENT_EMAIL || '',
    },
  };
};
