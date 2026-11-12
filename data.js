/* Housebets Sportsbook prototype — sample data only.
   No real players, no real money, no real fixtures.
   Team names are used the way the contest's own wireframe uses them
   (Arsenal v Brighton) — as sample content for the prototype. */
(function () {
  var T = function (short, name, color, dark) {
    return { short: short, name: name, color: color, dark: !!dark };
  };

  var TEAMS = {
    ARS: T('ARS', 'Arsenal', '#EF0107'),
    BHA: T('BHA', 'Brighton & Hove Albion', '#0057B8'),
    LIV: T('LIV', 'Liverpool', '#C8102E'),
    MUN: T('MUN', 'Manchester United', '#DA291C'),
    MCI: T('MCI', 'Manchester City', '#6CABDD', true),
    TOT: T('TOT', 'Tottenham Hotspur', '#B9C4D8', true),
    CHE: T('CHE', 'Chelsea', '#034694'),
    NEW: T('NEW', 'Newcastle United', '#3A3A3A'),
    RMA: T('RMA', 'Real Madrid', '#FEBE10', true),
    BAY: T('BAY', 'Bayern Munich', '#DC052D'),
    BAR: T('BAR', 'Barcelona', '#A50044'),
    RSO: T('RSO', 'Real Sociedad', '#0067B1'),
    JUV: T('JUV', 'Juventus', '#E8E8E8', true),
    MIL: T('MIL', 'AC Milan', '#FB090B'),
    DOR: T('DOR', 'Borussia Dortmund', '#FDE100', true),
    LEV: T('LEV', 'Bayer Leverkusen', '#E32221'),
    NAP: T('NAP', 'Napoli', '#12A0D7'),
    INT: T('INT', 'Inter', '#0068A8'),
    ROM: T('ROM', 'Roma', '#F0BC42', true),
    LAZ: T('LAZ', 'Lazio', '#87D8F7', true),
    SEV: T('SEV', 'Sevilla', '#D00027'),
    VAL: T('VAL', 'Valencia', '#F7B500', true),
    RBL: T('RBL', 'RB Leipzig', '#DD0741'),
    SGE: T('SGE', 'Eintracht Frankfurt', '#E1000F'),
    ATM: T('ATM', 'Atlético Madrid', '#CB3524'),
    LEI: T('LEI', 'Leicester City', '#003090'),
    WHU: T('WHU', 'West Ham United', '#7A263A'),
    AVL: T('AVL', 'Aston Villa', '#95BFE5', true)
  };

  var COMPS = [
    { id: 'epl', name: 'Premier League', country: 'England', sport: 'Soccer' },
    { id: 'ucl', name: 'Champions League', country: 'Europe', sport: 'Soccer' },
    { id: 'laliga', name: 'LaLiga', country: 'Spain', sport: 'Soccer' },
    { id: 'seriea', name: 'Serie A', country: 'Italy', sport: 'Soccer' },
    { id: 'bundes', name: 'Bundesliga', country: 'Germany', sport: 'Soccer' },
    { id: 'atp', name: 'ATP Finals', country: 'World', sport: 'Tennis' },
    { id: 'nba', name: 'NBA', country: 'USA', sport: 'Basketball' }
  ];

  /* status: live | upcoming. odds: [home, draw, away] decimal.
     Tennis/basketball use odds [home, away] (no draw). */
  var MATCHES = [
    { id: 'ars-bha', comp: 'epl', sport: 'Soccer', status: 'live', minute: 52, home: 'ARS', away: 'BHA', scoreH: 1, scoreA: 0, odds: [1.30, 4.60, 11.00], more: 115 },
    { id: 'liv-mun', comp: 'epl', sport: 'Soccer', status: 'live', minute: 67, home: 'LIV', away: 'MUN', scoreH: 2, scoreA: 1, odds: [1.65, 4.00, 4.33], more: 98 },
    { id: 'rma-bay', comp: 'ucl', sport: 'Soccer', status: 'live', minute: 34, home: 'RMA', away: 'BAY', scoreH: 0, scoreA: 0, odds: [2.20, 3.70, 2.90], more: 132 },
    { id: 'nap-int', comp: 'seriea', sport: 'Soccer', status: 'live', minute: 78, home: 'NAP', away: 'INT', scoreH: 1, scoreA: 1, odds: [2.40, 3.30, 3.10], more: 87 },
    { id: 'alc-sin', comp: 'atp', sport: 'Tennis', status: 'live', minute: 'Set 2', home: 'ALC', away: 'SIN', scoreH: '1', scoreA: '0', sets: '6-4, 3-2', odds: [1.72, 2.05], more: 41, tennis: true,
      homeName: 'C. Alcaraz', awayName: 'J. Sinner' },
    { id: 'lal-cel', comp: 'nba', sport: 'Basketball', status: 'live', minute: 'Q3 04:12', home: 'LAL', away: 'CEL', scoreH: 78, scoreA: 74, odds: [1.85, 1.95], more: 56, basketball: true,
      homeName: 'LA Lakers', awayName: 'Boston Celtics' },
    { id: 'mci-tot', comp: 'epl', sport: 'Soccer', status: 'upcoming', time: '17:30', date: 'Sat, Nov 14', home: 'MCI', away: 'TOT', odds: [1.50, 4.50, 5.25], more: 120 },
    { id: 'che-new', comp: 'epl', sport: 'Soccer', status: 'upcoming', time: '20:00', date: 'Sat, Nov 14', home: 'CHE', away: 'NEW', odds: [1.85, 3.60, 4.20], more: 88 },
    { id: 'lei-whu', comp: 'epl', sport: 'Soccer', status: 'upcoming', time: '15:00', date: 'Sat, Nov 14', home: 'LEI', away: 'WHU', odds: [2.10, 3.40, 3.50], more: 64 },
    { id: 'avl-ars', comp: 'epl', sport: 'Soccer', status: 'upcoming', time: '16:30', date: 'Sun, Nov 15', home: 'AVL', away: 'ARS', odds: [3.80, 3.60, 1.95], more: 96 },
    { id: 'bar-rso', comp: 'laliga', sport: 'Soccer', status: 'upcoming', time: '21:00', date: 'Sat, Nov 14', home: 'BAR', away: 'RSO', odds: [1.45, 4.80, 6.50], more: 104 },
    { id: 'sev-val', comp: 'laliga', sport: 'Soccer', status: 'upcoming', time: '20:00', date: 'Sun, Nov 15', home: 'SEV', away: 'VAL', odds: [2.05, 3.50, 3.60], more: 71 },
    { id: 'atm-rma', comp: 'laliga', sport: 'Soccer', status: 'upcoming', time: '21:00', date: 'Sun, Nov 15', home: 'ATM', away: 'RMA', odds: [2.90, 3.50, 2.40], more: 110 },
    { id: 'juv-mil', comp: 'seriea', sport: 'Soccer', status: 'upcoming', time: '18:00', date: 'Sun, Nov 15', home: 'JUV', away: 'MIL', odds: [2.15, 3.30, 3.40], more: 92 },
    { id: 'rom-laz', comp: 'seriea', sport: 'Soccer', status: 'upcoming', time: '20:45', date: 'Sun, Nov 15', home: 'ROM', away: 'LAZ', odds: [2.50, 3.20, 2.90], more: 83 },
    { id: 'dor-lev', comp: 'bundes', sport: 'Soccer', status: 'upcoming', time: '17:30', date: 'Sun, Nov 15', home: 'DOR', away: 'LEV', odds: [2.20, 3.70, 3.00], more: 90 },
    { id: 'rbl-sge', comp: 'bundes', sport: 'Soccer', status: 'upcoming', time: '15:30', date: 'Sat, Nov 14', home: 'RBL', away: 'SGE', odds: [1.80, 3.90, 4.10], more: 66 },
    { id: 'bay-mun', comp: 'ucl', sport: 'Soccer', status: 'upcoming', time: '20:00', date: 'Tue, Nov 17', home: 'BAY', away: 'MUN', odds: [1.55, 4.20, 5.50], more: 118 }
  ];

  /* Extra markets for the featured match page (Arsenal v Brighton, live).
     groups: Popular, Goals, Halves, Handicaps, Goalscorers, Corners & cards.
     Corners & cards is suspended — that is the suspended-market state. */
  var MATCH_MARKETS = {
    'ars-bha': [
      { group: 'Popular', markets: [
        { name: 'Match result', outcomes: [['Arsenal', 1.30], ['Draw', 4.60], ['Brighton', 11.00]] },
        { name: 'Both teams to score', outcomes: [['Yes', 1.85], ['No', 1.95]] },
        { name: 'Total goals — Over / Under 2.5', outcomes: [['Over 2.5', 1.95], ['Under 2.5', 1.85]] },
        { name: 'Double chance', outcomes: [['Arsenal or Draw', 1.12], ['Arsenal or Brighton', 1.18], ['Draw or Brighton', 3.20]] }
      ]},
      { group: 'Goals', markets: [
        { name: 'Total goals — Over / Under 1.5', outcomes: [['Over 1.5', 1.25], ['Under 1.5', 3.80]] },
        { name: 'Total goals — Over / Under 3.5', outcomes: [['Over 3.5', 3.10], ['Under 3.5', 1.35]] },
        { name: 'First team to score', outcomes: [['Arsenal', 1.22], ['Brighton', 5.50], ['No goal', 18.00]] },
        { name: 'Both halves over 0.5 goals', outcomes: [['Yes', 2.40], ['No', 1.55]] }
      ]},
      { group: 'Halves', markets: [
        { name: '1st half result', outcomes: [['Arsenal', 1.70], ['Draw', 2.40], ['Brighton', 9.00]] },
        { name: '2nd half result', outcomes: [['Arsenal', 1.95], ['Draw', 3.10], ['Brighton', 5.00]] },
        { name: 'Highest scoring half', outcomes: [['1st half', 3.00], ['2nd half', 1.95], ['Equal', 3.40]] }
      ]},
      { group: 'Handicaps', markets: [
        { name: 'Asian handicap — Arsenal -1.5', outcomes: [['Arsenal -1.5', 1.95], ['Brighton +1.5', 1.85]] },
        { name: 'Asian handicap — Arsenal -1', outcomes: [['Arsenal -1', 1.60], ['Brighton +1', 2.25]] },
        { name: 'European handicap — Arsenal -1', outcomes: [['Arsenal', 1.75], ['Draw', 3.90], ['Brighton', 4.60]] }
      ]},
      { group: 'Goalscorers', markets: [
        { name: 'Anytime goalscorer', outcomes: [['B. Saka', 2.10], ['K. Havertz', 2.60], ['L. Trossard', 3.00], ['D. Welbeck', 3.40], ['K. Mitoma', 4.00], ['Y. Minteh', 5.50]] },
        { name: 'First goalscorer', outcomes: [['B. Saka', 4.50], ['K. Havertz', 5.50], ['D. Welbeck', 7.00], ['K. Mitoma', 9.00]] }
      ]},
      { group: 'Corners & cards', suspended: true, markets: [
        { name: 'Total corners — Over / Under 9.5', outcomes: [['Over 9.5', 1.90], ['Under 9.5', 1.90]] },
        { name: 'Total cards — Over / Under 3.5', outcomes: [['Over 3.5', 2.00], ['Under 3.5', 1.80]] }
      ]}
    ]
  };

  var PLAYERS = ['B. Saka', 'K. Havertz', 'L. Trossard', 'D. Welbeck', 'K. Mitoma', 'Y. Minteh', 'M. Salah', 'E. Haaland', 'H. Kane', 'L. Yamal', 'C. Alcaraz', 'J. Sinner'];

  window.HB_DATA = { TEAMS: TEAMS, COMPS: COMPS, MATCHES: MATCHES, MATCH_MARKETS: MATCH_MARKETS, PLAYERS: PLAYERS };
})();
