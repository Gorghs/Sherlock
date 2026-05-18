import { Module } from '@nestjs/common';
import { LinkedInModule } from '@sherlock/source-linkedin';
import { IndeedModule } from '@sherlock/source-indeed';
import { GlassdoorModule } from '@sherlock/source-glassdoor';
import { ZipRecruiterModule } from '@sherlock/source-ziprecruiter';
import { GoogleModule } from '@sherlock/source-google';
import { BaytModule } from '@sherlock/source-bayt';
import { NaukriModule } from '@sherlock/source-naukri';
import { BDJobsModule } from '@sherlock/source-bdjobs';
import { InternshalaModule } from '@sherlock/source-internshala';
import { ExaModule } from '@sherlock/source-exa';
import { UpworkModule } from '@sherlock/source-upwork';
import { AshbyModule } from '@sherlock/source-ats-ashby';
import { GreenhouseModule } from '@sherlock/source-ats-greenhouse';
import { LeverModule } from '@sherlock/source-ats-lever';
import { WorkableModule } from '@sherlock/source-ats-workable';
import { SmartRecruitersModule } from '@sherlock/source-ats-smartrecruiters';
import { RipplingModule } from '@sherlock/source-ats-rippling';
import { WorkdayModule } from '@sherlock/source-ats-workday';
import { AmazonModule } from '@sherlock/source-company-amazon';
import { AppleModule } from '@sherlock/source-company-apple';
import { MicrosoftModule } from '@sherlock/source-company-microsoft';
import { NvidiaModule } from '@sherlock/source-company-nvidia';
import { TikTokModule } from '@sherlock/source-company-tiktok';
import { UberModule } from '@sherlock/source-company-uber';
import { CursorModule } from '@sherlock/source-company-cursor';
import { RemoteOkModule } from '@sherlock/source-remoteok';
import { RemotiveModule } from '@sherlock/source-remotive';
import { JobicyModule } from '@sherlock/source-jobicy';
import { HimalayasModule } from '@sherlock/source-himalayas';
import { ArbeitnowModule } from '@sherlock/source-arbeitnow';
import { WeWorkRemotelyModule } from '@sherlock/source-weworkremotely';
import { RecruiteeModule } from '@sherlock/source-ats-recruitee';
import { TeamtailorModule } from '@sherlock/source-ats-teamtailor';
import { UsajobsModule } from '@sherlock/source-usajobs';
import { AdzunaModule } from '@sherlock/source-adzuna';
import { ReedModule } from '@sherlock/source-reed';
import { JoobleModule } from '@sherlock/source-jooble';
import { CareerJetModule } from '@sherlock/source-careerjet';
import { BambooHRModule } from '@sherlock/source-ats-bamboohr';
import { PersonioModule } from '@sherlock/source-ats-personio';
import { JazzHRModule } from '@sherlock/source-ats-jazzhr';
import { DiceModule } from '@sherlock/source-dice';
import { SimplyHiredModule } from '@sherlock/source-simplyhired';
import { WellfoundModule } from '@sherlock/source-wellfound';
import { StepStoneModule } from '@sherlock/source-stepstone';
import { MonsterModule } from '@sherlock/source-monster';
import { CareerBuilderModule } from '@sherlock/source-careerbuilder';
import { IcimsModule } from '@sherlock/source-ats-icims';
import { TaleoModule } from '@sherlock/source-ats-taleo';
import { SuccessFactorsModule } from '@sherlock/source-ats-successfactors';
import { JobviteModule } from '@sherlock/source-ats-jobvite';
import { AdpModule } from '@sherlock/source-ats-adp';
import { UkgModule } from '@sherlock/source-ats-ukg';
import { GoogleCareersModule } from '@sherlock/source-company-google';
import { MetaModule } from '@sherlock/source-company-meta';
import { NetflixModule } from '@sherlock/source-company-netflix';
import { StripeModule } from '@sherlock/source-company-stripe';
import { OpenAIModule } from '@sherlock/source-company-openai';
import { BreezyHRModule } from '@sherlock/source-ats-breezyhr';
import { ComeetModule } from '@sherlock/source-ats-comeet';
import { PinpointModule } from '@sherlock/source-ats-pinpoint';
import { BuiltInModule } from '@sherlock/source-builtin';
import { SnagajobModule } from '@sherlock/source-snagajob';
import { DribbbleModule } from '@sherlock/source-dribbble';
// Phase 8: ATS Expansion
import { ManatalModule } from '@sherlock/source-ats-manatal';
import { PaylocityModule } from '@sherlock/source-ats-paylocity';
import { FreshteamModule } from '@sherlock/source-ats-freshteam';
import { BullhornModule } from '@sherlock/source-ats-bullhorn';
import { TrakstarModule } from '@sherlock/source-ats-trakstar';
import { HiringThingModule } from '@sherlock/source-ats-hiringthing';
import { LoxoModule } from '@sherlock/source-ats-loxo';
import { FountainModule } from '@sherlock/source-ats-fountain';
import { DeelModule } from '@sherlock/source-ats-deel';
import { PhenomModule } from '@sherlock/source-ats-phenom';
import { IbmModule } from '@sherlock/source-company-ibm';
import { BoeingModule } from '@sherlock/source-company-boeing';
import { ZoomModule } from '@sherlock/source-company-zoom';
// Phase 9: Job board expansion
import { TheMuseModule } from '@sherlock/source-themuse';
import { WorkingNomadsModule } from '@sherlock/source-workingnomads';
import { FourDayWeekModule } from '@sherlock/source-4dayweek';
import { StartupJobsModule } from '@sherlock/source-startupjobs';
import { NoDeskModule } from '@sherlock/source-nodesk';
import { Web3CareerModule } from '@sherlock/source-web3career';
import { EchoJobsModule } from '@sherlock/source-echojobs';
import { JobstreetModule } from '@sherlock/source-jobstreet';
// Phase 10: Government boards & ATS expansion
import { CareerOneStopModule } from '@sherlock/source-careeronestop';
import { ArbeitsagenturModule } from '@sherlock/source-arbeitsagentur';
import { JobylonModule } from '@sherlock/source-ats-jobylon';
import { HomerunModule } from '@sherlock/source-ats-homerun';
// Phase 11: Niche boards & developer API expansion
import { HackerNewsModule } from '@sherlock/source-hackernews';
import { LandingJobsModule } from '@sherlock/source-landingjobs';
import { FindWorkModule } from '@sherlock/source-findwork';
import { JobDataApiModule } from '@sherlock/source-jobdataapi';
// Phase 12: ATS & niche board expansion
import { AuthenticJobsModule } from '@sherlock/source-authenticjobs';
import { JobScoreModule } from '@sherlock/source-ats-jobscore';
import { TalentLyftModule } from '@sherlock/source-ats-talentlyft';
// Phase 13: RSS niche board expansion
import { CryptoJobsListModule } from '@sherlock/source-cryptojobslist';
import { JobspressoModule } from '@sherlock/source-jobspresso';
import { HigherEdJobsModule } from '@sherlock/source-higheredjobs';
import { FossJobsModule } from '@sherlock/source-fossjobs';
import { LaraJobsModule } from '@sherlock/source-larajobs';
import { PythonJobsModule } from '@sherlock/source-pythonjobs';
import { DrupalJobsModule } from '@sherlock/source-drupaljobs';
import { RealWorkFromAnywhereModule } from '@sherlock/source-realworkfromanywhere';
import { GolangJobsModule } from '@sherlock/source-golangjobs';
import { WordPressJobsModule } from '@sherlock/source-wordpressjobs';
// Phase 14: API-key sources & ATS expansion
import { TalrooModule } from '@sherlock/source-talroo';
import { InfoJobsModule } from '@sherlock/source-infojobs';
import { CrelateModule } from '@sherlock/source-ats-crelate';
import { ISmartRecruitModule } from '@sherlock/source-ats-ismartrecruit';
import { RecruiterflowModule } from '@sherlock/source-ats-recruiterflow';
// Phase 15: European government & regional boards
import { JobTechDevModule } from '@sherlock/source-jobtechdev';
import { FranceTravailModule } from '@sherlock/source-francetravail';
import { NavJobsModule } from '@sherlock/source-navjobs';
import { JobsAcUkModule } from '@sherlock/source-jobsacuk';
import { JobindexModule } from '@sherlock/source-jobindex';
// Phase 16: Global expansion (LatAm, gig, startup, Canada)
import { GetOnBoardModule } from '@sherlock/source-getonboard';
import { FreelancerComModule } from '@sherlock/source-freelancercom';
import { JoinRiseModule } from '@sherlock/source-joinrise';
import { CanadaJobBankModule } from '@sherlock/source-canadajobbank';
// Phase 17: Niche & international expansion (NGO, UN, IT)
import { ReliefWebModule } from '@sherlock/source-reliefweb';
import { UndpJobsModule } from '@sherlock/source-undpjobs';
import { DevITJobsModule } from '@sherlock/source-devitjobs';
// Phase 18: Niche RSS expansion (tech, design, environment, regional)
import { PyJobsModule } from '@sherlock/source-pyjobs';
import { VueJobsModule } from '@sherlock/source-vuejobs';
import { ConservationJobsModule } from '@sherlock/source-conservationjobs';
import { CoroflotModule } from '@sherlock/source-coroflot';
import { BerlinStartupJobsModule } from '@sherlock/source-berlinstartupjobs';
// Phase 19: Tech niche, crypto, regional expansion
import { RailsJobsModule } from '@sherlock/source-railsjobs';
import { ElixirJobsModule } from '@sherlock/source-elixirjobs';
import { CrunchboardModule } from '@sherlock/source-crunchboard';
import { CryptocurrencyJobsModule } from '@sherlock/source-cryptocurrencyjobs';
import { HasJobModule } from '@sherlock/source-hasjob';
// Phase 20: European regional & niche expansion
import { IcrunchdataModule } from '@sherlock/source-icrunchdata';
import { SwissdevjobsModule } from '@sherlock/source-swissdevjobs';
import { GermantechjobsModule } from '@sherlock/source-germantechjobs';
import { VirtualVocationsModule } from '@sherlock/source-virtualvocations';
import { NoFluffJobsModule } from '@sherlock/source-nofluffjobs';
// Phase 21: Niche & academic expansion
import { GreenJobsBoardModule } from '@sherlock/source-greenjobsboard';
import { EurojobsModule } from '@sherlock/source-eurojobs';
import { OpensourcedesignjobsModule } from '@sherlock/source-opensourcedesignjobs';
import { AcademiccareersModule } from '@sherlock/source-academiccareers';
import { RemotefirstjobsModule } from '@sherlock/source-remotefirstjobs';
// Phase 22: Eastern European, CIS & Singapore expansion
import { DjinniModule } from '@sherlock/source-djinni';
import { HeadhunterModule } from '@sherlock/source-headhunter';
import { HabrcareerModule } from '@sherlock/source-habrcareer';
import { MycareersfutureModule } from '@sherlock/source-mycareersfuture';
// Phase 23: Japan, Nordic & Swiss expansion
import { JobsInJapanModule } from '@sherlock/source-jobsinjapan';
import { DuunitoriModule } from '@sherlock/source-duunitori';
import { JobsChModule } from '@sherlock/source-jobsch';
// Phase 24: UK & mobile dev expansion
import { GuardianjobsModule } from '@sherlock/source-guardianjobs';
import { AndroidjobsModule } from '@sherlock/source-androidjobs';
import { IosdevjobsModule } from '@sherlock/source-iosdevjobs';
// Phase 25: DevOps niche expansion
import { DevopsjobsModule } from '@sherlock/source-devopsjobs';
// Phase 25: FP, diversity & niche expansion
import { FunctionalworksModule } from '@sherlock/source-functionalworks';
import { PowertoflyModule } from '@sherlock/source-powertofly';
import { ClojurejobsModule } from '@sherlock/source-clojurejobs';
// Phase 26: Sustainability & niche expansion
import { EcojobsModule } from '@sherlock/source-ecojobs';
import { AnalyticsModule } from '@sherlock/analytics';
import { JobsService } from '../../api/src/jobs/jobs.service';
import { SearchCommand } from './commands/search.command';
import { CompareCommand } from './commands/compare.command';

@Module({
  imports: [
    // Search-based sources
    LinkedInModule,
    IndeedModule,
    GlassdoorModule,
    ZipRecruiterModule,
    GoogleModule,
    BaytModule,
    NaukriModule,
    BDJobsModule,
    InternshalaModule,
    ExaModule,
    UpworkModule,
    // ATS sources
    AshbyModule,
    GreenhouseModule,
    LeverModule,
    WorkableModule,
    SmartRecruitersModule,
    RipplingModule,
    WorkdayModule,
    // Company-specific sources
    AmazonModule,
    AppleModule,
    MicrosoftModule,
    NvidiaModule,
    TikTokModule,
    UberModule,
    CursorModule,
    // Remote job boards
    RemoteOkModule,
    RemotiveModule,
    JobicyModule,
    HimalayasModule,
    ArbeitnowModule,
    WeWorkRemotelyModule,
    // Additional ATS sources
    RecruiteeModule,
    TeamtailorModule,
    // API-key sources (Tier 1.5)
    UsajobsModule,
    AdzunaModule,
    ReedModule,
    JoobleModule,
    CareerJetModule,
    // Phase 3 ATS sources
    BambooHRModule,
    PersonioModule,
    JazzHRModule,
    // Phase 3 Playwright sources
    DiceModule,
    SimplyHiredModule,
    WellfoundModule,
    StepStoneModule,
    MonsterModule,
    CareerBuilderModule,
    // Phase 4 Tier 3 ATS sources
    IcimsModule,
    TaleoModule,
    SuccessFactorsModule,
    // Phase 5 ATS sources
    JobviteModule,
    AdpModule,
    UkgModule,
    // Phase 6: New company scrapers
    GoogleCareersModule,
    MetaModule,
    NetflixModule,
    StripeModule,
    OpenAIModule,
    // Phase 6: New ATS sources
    BreezyHRModule,
    ComeetModule,
    PinpointModule,
    // Phase 7: Additional job boards
    BuiltInModule,
    SnagajobModule,
    DribbbleModule,
    // Phase 8: ATS Expansion
    ManatalModule,
    PaylocityModule,
    FreshteamModule,
    BullhornModule,
    TrakstarModule,
    HiringThingModule,
    LoxoModule,
    FountainModule,
    DeelModule,
    PhenomModule,
    // Phase 8: Company scrapers
    IbmModule,
    BoeingModule,
    ZoomModule,
    // Phase 9: Job board expansion
    TheMuseModule,
    WorkingNomadsModule,
    FourDayWeekModule,
    StartupJobsModule,
    NoDeskModule,
    Web3CareerModule,
    EchoJobsModule,
    JobstreetModule,
    // Phase 10: Government boards & ATS expansion
    CareerOneStopModule,
    ArbeitsagenturModule,
    JobylonModule,
    HomerunModule,
    // Phase 11: Niche boards & developer API expansion
    HackerNewsModule,
    LandingJobsModule,
    FindWorkModule,
    JobDataApiModule,
    // Phase 12: ATS & niche board expansion
    AuthenticJobsModule,
    JobScoreModule,
    TalentLyftModule,
    // Phase 13: RSS niche board expansion
    CryptoJobsListModule,
    JobspressoModule,
    HigherEdJobsModule,
    FossJobsModule,
    LaraJobsModule,
    PythonJobsModule,
    DrupalJobsModule,
    RealWorkFromAnywhereModule,
    GolangJobsModule,
    WordPressJobsModule,
    // Phase 14: API-key sources & ATS expansion
    TalrooModule,
    InfoJobsModule,
    CrelateModule,
    ISmartRecruitModule,
    RecruiterflowModule,
    // Phase 15: European government & regional boards
    JobTechDevModule,
    FranceTravailModule,
    NavJobsModule,
    JobsAcUkModule,
    JobindexModule,
    // Phase 16: Global expansion (LatAm, gig, startup, Canada)
    GetOnBoardModule,
    FreelancerComModule,
    JoinRiseModule,
    CanadaJobBankModule,
    // Phase 17: Niche & international expansion (NGO, UN, IT)
    ReliefWebModule,
    UndpJobsModule,
    DevITJobsModule,
    // Phase 18: Niche RSS expansion (tech, design, environment, regional)
    PyJobsModule,
    VueJobsModule,
    ConservationJobsModule,
    CoroflotModule,
    BerlinStartupJobsModule,
    // Phase 19: Tech niche, crypto, regional expansion
    RailsJobsModule,
    ElixirJobsModule,
    CrunchboardModule,
    CryptocurrencyJobsModule,
    HasJobModule,
    // Phase 20: European regional & niche expansion
    IcrunchdataModule,
    SwissdevjobsModule,
    GermantechjobsModule,
    VirtualVocationsModule,
    NoFluffJobsModule,
    // Phase 21: Niche & academic expansion
    GreenJobsBoardModule,
    EurojobsModule,
    OpensourcedesignjobsModule,
    AcademiccareersModule,
    RemotefirstjobsModule,
    // Phase 22: Eastern European, CIS & Singapore expansion
    DjinniModule,
    HeadhunterModule,
    HabrcareerModule,
    MycareersfutureModule,
    // Phase 23: Japan, Nordic & Swiss expansion
    JobsInJapanModule,
    DuunitoriModule,
    JobsChModule,
    // Phase 24: UK & mobile dev expansion
    GuardianjobsModule,
    AndroidjobsModule,
    IosdevjobsModule,
    // Phase 25: DevOps niche expansion
    DevopsjobsModule,
    // Phase 25: FP, diversity & niche expansion
    FunctionalworksModule,
    PowertoflyModule,
    ClojurejobsModule,
    // Phase 26: Sustainability & niche expansion
    EcojobsModule,
    // Analytics
    AnalyticsModule,
  ],
  providers: [JobsService, SearchCommand, CompareCommand],
})
export class CliModule {}
