import type { Country } from './fiscal-calendar'

export interface FieldConfig {
  key:    string
  label:  string
  hint?:  string
  negate?: boolean  // resta en vez de sumar al resultado
}

export interface ModelConfig {
  titulo:      string
  subtitulo:   string
  currency:    string
  agencia:     string
  agenciaUrl:  string
  fields:      FieldConfig[]
  // (vals) => resultado neto — si undefined, resultado = sum(fields con !negate) - sum(fields con negate)
  calcResult?: (vals: Record<string, number>) => number
  taxRate?:    number    // tipo mostrado informativamente
  taxLabel?:   string
  disclaimer?: string
}

export type CountryModels = Record<string, ModelConfig>

// ── Francia ──────────────────────────────────────────────────────────────────

const FR_MODELS: CountryModels = {
  TVA: {
    titulo:     'Déclaration TVA',
    subtitulo:  'Taxe sur la Valeur Ajoutée — Déclaration trimestrielle',
    currency:   'EUR',
    agencia:    'Direction des Impôts',
    agenciaUrl: 'https://www.impots.gouv.fr/professionnel/la-tva',
    fields: [
      { key: 'ca_ht',      label: "Chiffre d'affaires HT",    hint: 'Total ventes hors taxes' },
      { key: 'tva20',      label: 'TVA collectée 20%',         hint: 'Taux normal' },
      { key: 'tva10',      label: 'TVA collectée 10%',         hint: 'Taux intermédiaire' },
      { key: 'tva5',       label: 'TVA collectée 5,5%',        hint: 'Taux réduit' },
      { key: 'tva_ded',    label: 'TVA déductible',            hint: 'TVA sur achats récupérable', negate: true },
      { key: 'acomptes',   label: 'Acomptes déjà versés',      hint: 'Paiements antérieurs', negate: true },
    ],
    calcResult: (v) => (v.tva20! + v.tva10! + v.tva5!) - v.tva_ded! - v.acomptes!,
    disclaimer: 'Calcul indicatif. La déclaration officielle se fait via l\'espace professionnel impots.gouv.fr.',
  },
  IS: {
    titulo:     'Impôt sur les Sociétés',
    subtitulo:  'IS exercice annuel — taux normal 25%',
    currency:   'EUR',
    agencia:    'Direction des Impôts',
    agenciaUrl: 'https://www.impots.gouv.fr/professionnel/impot-sur-les-societes',
    taxRate:    25,
    taxLabel:   'IS 25%',
    fields: [
      { key: 'resultat_fiscal', label: 'Résultat fiscal',       hint: 'Bénéfice imposable de l\'exercice' },
      { key: 'credits',         label: 'Crédits d\'impôt',      hint: 'CIR, crédit formation, etc.', negate: true },
      { key: 'acomptes',        label: 'Acomptes versés',        hint: 'Versements trimestriels IS', negate: true },
    ],
    calcResult: (v) => v.resultat_fiscal! * 0.25 - v.credits! - v.acomptes!,
    disclaimer: 'Taux standard 25%. PME (<10M€ CA, <7,63M€ bénéfice): 15% jusqu\'à 42 500 €, 25% au-delà.',
  },
  IR: {
    titulo:     'Impôt sur le Revenu',
    subtitulo:  'Déclaration annuelle revenus — barème progressif',
    currency:   'EUR',
    agencia:    'Direction des Impôts',
    agenciaUrl: 'https://www.impots.gouv.fr/particulier/declaration-de-revenus',
    fields: [
      { key: 'revenus_bruts',  label: 'Revenus bruts déclarés',   hint: 'Total revenus imposables' },
      { key: 'charges_ded',    label: 'Charges déductibles',       hint: 'Frais professionnels réels', negate: true },
      { key: 'retenues',       label: 'Retenues à la source',      hint: 'Déjà prélevées', negate: true },
    ],
    disclaimer: 'Le calcul exact dépend du quotient familial et du barème progressif. Résultat orientatif.',
  },
  CFE: {
    titulo:     'Cotisation Foncière des Entreprises',
    subtitulo:  'CFE — échéance décembre',
    currency:   'EUR',
    agencia:    'Direction des Impôts',
    agenciaUrl: 'https://www.impots.gouv.fr/professionnel/cotisation-fonciere-des-entreprises',
    fields: [
      { key: 'base_nette',  label: 'Base nette CFE',       hint: 'Valeur locative × taux communal' },
      { key: 'reduction',   label: 'Réductions / exos',    hint: 'Exonérations applicables', negate: true },
      { key: 'acompte',     label: 'Acompte de juin',      hint: 'Si > 3 000 € d\'IS', negate: true },
    ],
    disclaimer: 'La base et le taux sont fixés par la commune. Consultez l\'avis d\'imposition CFE.',
  },
}

// ── Portugal ─────────────────────────────────────────────────────────────────

const PT_MODELS: CountryModels = {
  IVA: {
    titulo:     'Declaração Periódica de IVA',
    subtitulo:  'IVA trimestral — Autoridade Tributária',
    currency:   'EUR',
    agencia:    'AT / Finanças',
    agenciaUrl: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/iva.aspx',
    fields: [
      { key: 'vendas_normal',  label: 'Vendas taxa normal 23%',    hint: 'Base tributável taxa 23%' },
      { key: 'iva_normal',     label: 'IVA liquidado 23%' },
      { key: 'vendas_inter',   label: 'Vendas taxa intermédia 13%', hint: 'Base tributável taxa 13%' },
      { key: 'iva_inter',      label: 'IVA liquidado 13%' },
      { key: 'vendas_red',     label: 'Vendas taxa reduzida 6%',    hint: 'Base tributável taxa 6%' },
      { key: 'iva_red',        label: 'IVA liquidado 6%' },
      { key: 'iva_ded',        label: 'IVA dedutível',              hint: 'IVA suportado recuperável', negate: true },
      { key: 'pagamentos',     label: 'Pagamentos anteriores',      negate: true },
    ],
    calcResult: (v) => (v.iva_normal! + v.iva_inter! + v.iva_red!) - v.iva_ded! - v.pagamentos!,
    disclaimer: 'Valores orientativos. Submeta a declaração via Portal das Finanças.',
  },
  IRC: {
    titulo:     'Imposto sobre o Rendimento das Pessoas Coletivas',
    subtitulo:  'IRC exercício 2024 — taxa 21%',
    currency:   'EUR',
    agencia:    'AT / Finanças',
    agenciaUrl: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/irc.aspx',
    taxRate:    21,
    taxLabel:   'IRC 21%',
    fields: [
      { key: 'lucro_tributavel', label: 'Lucro tributável',          hint: 'Resultado fiscal do exercício' },
      { key: 'derrama',          label: 'Derrama municipal',         hint: 'Até 1,5% do lucro tributável' },
      { key: 'beneficios',       label: 'Benefícios fiscais',        negate: true },
      { key: 'pag_especial',     label: 'Pagamento especial (PEC)',  negate: true },
      { key: 'pag_conta',        label: 'Pagamentos por conta',      negate: true },
      { key: 'retencoes',        label: 'Retenções na fonte',        negate: true },
    ],
    calcResult: (v) => v.lucro_tributavel! * 0.21 + v.derrama! - v.beneficios! - v.pag_especial! - v.pag_conta! - v.retencoes!,
    disclaimer: 'PME com lucro ≤ 50 000 €: taxa reduzida 17%. Derrama até 1,5% conforme município.',
  },
  IRS: {
    titulo:     'IRS — Declaração de Rendimentos',
    subtitulo:  'Imposto sobre o Rendimento das Pessoas Singulares 2024',
    currency:   'EUR',
    agencia:    'AT / Finanças',
    agenciaUrl: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/irs.aspx',
    fields: [
      { key: 'rendimentos',  label: 'Rendimentos brutos',      hint: 'Total rendimentos Categoria B/outros' },
      { key: 'deducoes',     label: 'Deduções à coleta',       hint: 'Saúde, educação, habitação, etc.', negate: true },
      { key: 'retencoes',    label: 'Retenções na fonte',      negate: true },
      { key: 'pagamentos',   label: 'Pagamentos por conta',    negate: true },
    ],
    disclaimer: 'IRS sujeito a taxas progressivas (14,5% – 48%). Resultado orientatif.',
  },
  IES: {
    titulo:     'IES / Declaração Anual',
    subtitulo:  'Informação Empresarial Simplificada — exercício 2024',
    currency:   'EUR',
    agencia:    'AT / Finanças',
    agenciaUrl: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/ies.aspx',
    fields: [
      { key: 'volume_negocios', label: 'Volume de negócios',  hint: 'Total faturação do exercício' },
      { key: 'total_ativo',     label: 'Total do ativo',      hint: 'Balanço final de exercício' },
      { key: 'resultado_liq',   label: 'Resultado líquido',   hint: 'Lucro ou prejuízo do exercício' },
    ],
    disclaimer: 'A IES é uma declaração informativa. Não gera pagamento direto — serve para estatísticas e contas anuais.',
  },
}

// ── Italia ────────────────────────────────────────────────────────────────────

const IT_MODELS: CountryModels = {
  IVA: {
    titulo:     'Liquidazione IVA',
    subtitulo:  'Dichiarazione periodica IVA trimestrale',
    currency:   'EUR',
    agencia:    'Agenzia delle Entrate',
    agenciaUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/iva',
    fields: [
      { key: 'iva_vendite22', label: 'IVA sulle vendite 22%',    hint: 'Aliquota ordinaria' },
      { key: 'iva_vendite10', label: 'IVA sulle vendite 10%',    hint: 'Aliquota ridotta' },
      { key: 'iva_vendite4',  label: 'IVA sulle vendite 4%',     hint: 'Aliquota super-ridotta' },
      { key: 'iva_acquisti',  label: 'IVA detraibile acquisti',  negate: true },
      { key: 'eccedenza',     label: 'Eccedenza periodo prec.',  hint: 'Credito da liquidazione precedente', negate: true },
    ],
    calcResult: (v) => v.iva_vendite22! + v.iva_vendite10! + v.iva_vendite4! - v.iva_acquisti! - v.eccedenza!,
    disclaimer: 'Versamento tramite modello F24. Interessi 1% per liquidazioni trimestrali.',
  },
  IRES: {
    titulo:     'IRES — Imposta sul Reddito delle Società',
    subtitulo:  'IRES esercizio 2024 — aliquota 24%',
    currency:   'EUR',
    agencia:    'Agenzia delle Entrate',
    agenciaUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/ires',
    taxRate:    24,
    taxLabel:   'IRES 24%',
    fields: [
      { key: 'reddito_imp',  label: 'Reddito imponibile',        hint: 'Utile fiscale dopo variazioni' },
      { key: 'deduzioni',    label: 'Deduzioni / agevolazioni',  negate: true },
      { key: 'acconti',      label: 'Acconti versati',           negate: true },
      { key: 'ritenute',     label: 'Ritenute subite',           negate: true },
    ],
    calcResult: (v) => v.reddito_imp! * 0.24 - v.deduzioni! - v.acconti! - v.ritenute!,
    disclaimer: 'Aliquota IRES 24%. Addizionale del 3,5% per enti creditizi e finanziari.',
  },
  IRAP: {
    titulo:     'IRAP — Imposta Regionale Attività Produttive',
    subtitulo:  'IRAP esercizio 2024 — aliquota base 3,9%',
    currency:   'EUR',
    agencia:    'Agenzia delle Entrate',
    agenciaUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/irap',
    taxRate:    3.9,
    taxLabel:   'IRAP 3,9%',
    fields: [
      { key: 'valore_prod',  label: 'Valore della produzione netta', hint: 'Base imponibile IRAP' },
      { key: 'deduzioni',    label: 'Deduzioni spese personale',     negate: true },
      { key: 'acconti',      label: 'Acconti versati',               negate: true },
    ],
    calcResult: (v) => v.valore_prod! * 0.039 - v.deduzioni! - v.acconti!,
    disclaimer: 'Le aliquote variano per regione (base 3,9%). Alcune regioni applicano aliquote diverse.',
  },
  '730': {
    titulo:     'Modello 730 — Dichiarazione dei Redditi',
    subtitulo:  'Dichiarazione persone fisiche esercizio 2024',
    currency:   'EUR',
    agencia:    'Agenzia delle Entrate',
    agenciaUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/dichiarazione-730',
    fields: [
      { key: 'reddito_comp', label: 'Reddito complessivo',     hint: 'Somma tutti i redditi imponibili' },
      { key: 'oneri_ded',    label: 'Oneri deducibili',        negate: true },
      { key: 'detrazioni',   label: 'Detrazioni d\'imposta',   negate: true },
      { key: 'ritenute',     label: 'Ritenute subite',         negate: true },
      { key: 'acconti',      label: 'Acconti versati',         negate: true },
    ],
    disclaimer: 'L\'IRPEF è calcolata con aliquote progressive (23%–43%). Risultato indicativo.',
  },
  F24: {
    titulo:     'Modello F24 — Versamenti',
    subtitulo:  'Riepilogo pagamenti fiscali e contributivi',
    currency:   'EUR',
    agencia:    'Agenzia delle Entrate',
    agenciaUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/modello-f24',
    fields: [
      { key: 'imposte',       label: 'Imposte (IRES/IRPEF/IRAP)',   hint: 'Codice tributo corrispondente' },
      { key: 'contributi',    label: 'Contributi INPS',              hint: 'Contributi previdenziali' },
      { key: 'interessi',     label: 'Interessi e sanzioni',         hint: 'Se ravvedimento operoso' },
      { key: 'compensazioni', label: 'Compensazioni crediti',        negate: true },
    ],
    disclaimer: 'Il modello F24 è lo strumento di pagamento unificato. Compila i codici tributo corrispondenti.',
  },
}

// ── Bélgica ──────────────────────────────────────────────────────────────────

const BE_MODELS: CountryModels = {
  TVA: {
    titulo:     'Déclaration TVA',
    subtitulo:  'Taxe sur la Valeur Ajoutée trimestrielle — SPF Finances',
    currency:   'EUR',
    agencia:    'SPF Finances',
    agenciaUrl: 'https://finances.belgium.be/fr/entreprises/tva',
    fields: [
      { key: 'ca_ht21',    label: 'CA HT taux normal 21%',     hint: 'Grille 03' },
      { key: 'tva21',      label: 'TVA collectée 21%' },
      { key: 'ca_ht12',    label: 'CA HT taux intermédiaire 12%' },
      { key: 'tva12',      label: 'TVA collectée 12%' },
      { key: 'ca_ht6',     label: 'CA HT taux réduit 6%' },
      { key: 'tva6',       label: 'TVA collectée 6%' },
      { key: 'tva_ded',    label: 'TVA déductible (Grille 59)', negate: true },
      { key: 'versements', label: 'Versements déjà effectués',  negate: true },
    ],
    calcResult: (v) => (v.tva21! + v.tva12! + v.tva6!) - v.tva_ded! - v.versements!,
    disclaimer: 'Déclaration via MyMinFin Pro. Dépôt et paiement avant le 20 du mois suivant le trimestre.',
  },
  ISOC: {
    titulo:     'Impôt des Sociétés (ISOC)',
    subtitulo:  'Exercice 2024 — taux 25% (PME 20%)',
    currency:   'EUR',
    agencia:    'SPF Finances',
    agenciaUrl: 'https://finances.belgium.be/fr/entreprises/impot-des-societes',
    taxRate:    25,
    taxLabel:   'ISOC 25%',
    fields: [
      { key: 'benefice_imp', label: 'Bénéfice imposable',           hint: 'Résultat fiscal de l\'exercice' },
      { key: 'ded_rdt',      label: 'Déduction RDT (div. reçus)',   negate: true },
      { key: 'precomptes',   label: 'Précomptes mobiliers/immob.',  negate: true },
      { key: 'versements',   label: 'Versements anticipés',         negate: true },
    ],
    calcResult: (v) => v.benefice_imp! * 0.25 - v.ded_rdt! - v.precomptes! - v.versements!,
    disclaimer: 'PME: taux réduit 20% sur la 1re tranche de 100 000 €. ISOC déclarée via Biztax.',
  },
  IPP: {
    titulo:     'Impôt des Personnes Physiques (IPP)',
    subtitulo:  'Déclaration annuelle revenus 2024',
    currency:   'EUR',
    agencia:    'SPF Finances',
    agenciaUrl: 'https://finances.belgium.be/fr/particuliers/impot-des-personnes-physiques',
    fields: [
      { key: 'revenus_nets', label: 'Revenus nets imposables',    hint: 'Après frais professionnels' },
      { key: 'quotas_exempts', label: 'Quotité exemptée (QFI)', hint: '9 270 € en 2024 (base)', negate: true },
      { key: 'precomptes',   label: 'Précomptes professionnels',  negate: true },
      { key: 'reductions',   label: 'Réductions d\'impôt',        negate: true },
    ],
    disclaimer: 'IPP calculé selon barème progressif (25%–50%). Résultat très orientatif selon situation.',
  },
  ONSS: {
    titulo:     'Cotisations ONSS',
    subtitulo:  'Cotisations patronales et personnelles trimestrielles',
    currency:   'EUR',
    agencia:    'ONSS',
    agenciaUrl: 'https://www.onss.be',
    fields: [
      { key: 'salaires_bruts',  label: 'Masse salariale brute',         hint: 'Total rémunérations du trimestre' },
      { key: 'cotis_patronales', label: 'Cotisations patronales ~25%',  hint: 'Taux moyen secteur privé' },
      { key: 'cotis_perso',     label: 'Cotisations personnelles ~13%', hint: 'Retenues sur salaires' },
      { key: 'reductions',      label: 'Réductions de cotisations',     negate: true },
    ],
    calcResult: (v) => v.cotis_patronales! + v.cotis_perso! - v.reductions!,
    disclaimer: 'Taux ONSS variables selon secteur et catégorie. Déclaration via DmfA.',
  },
}

// ── Alemania ──────────────────────────────────────────────────────────────────

const DE_MODELS: CountryModels = {
  USt: {
    titulo:     'Umsatzsteuer-Voranmeldung',
    subtitulo:  'Umsatzsteuer (USt) Quartal — Finanzamt',
    currency:   'EUR',
    agencia:    'Finanzamt',
    agenciaUrl: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html',
    fields: [
      { key: 'ust19',       label: 'USt auf Umsätze 19%',       hint: 'Steuerpflichtige Umsätze Regelsteuersatz' },
      { key: 'ust7',        label: 'USt auf Umsätze 7%',        hint: 'Ermäßigter Steuersatz' },
      { key: 'vorsteuer',   label: 'Vorsteuer (abzugsfähig)',   hint: 'USt aus Eingangsrechnungen', negate: true },
      { key: 'vorauszahl',  label: 'Vorauszahlungen',           hint: 'Bereits geleistete Zahlungen', negate: true },
    ],
    calcResult: (v) => v.ust19! + v.ust7! - v.vorsteuer! - v.vorauszahl!,
    disclaimer: 'Übermittlung via ELSTER. Fälligkeit: 10. des Folgemonats nach Voranmeldezeitraum.',
  },
  KSt: {
    titulo:     'Körperschaftsteuer',
    subtitulo:  'KSt Geschäftsjahr 2024 — Steuersatz 15% + SolZ',
    currency:   'EUR',
    agencia:    'Finanzamt',
    agenciaUrl: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/Unternehmenssteuern/koerperschaftsteuer.html',
    taxRate:    15,
    taxLabel:   'KSt 15% + SolZ 5,5%',
    fields: [
      { key: 'zve',          label: 'Zu versteuerndes Einkommen', hint: 'Handelsrechtlicher Gewinn ± steuerliche Korrekturen' },
      { key: 'verlustabzug', label: 'Verlustvortrag (§10a KStG)', hint: 'Verrechenbare Vorjahresverluste', negate: true },
      { key: 'vorauszahl',   label: 'Vorauszahlungen',            hint: 'Quartalsvorauszahlungen KSt', negate: true },
      { key: 'anrechnung',   label: 'Anrechnungsbeträge',         hint: 'Quellensteuer, ausl. Steuer', negate: true },
    ],
    calcResult: (v) => {
      const basis = Math.max(0, v.zve! - v.verlustabzug!)
      const kst = basis * 0.15
      const solz = kst * 0.055
      return kst + solz - v.vorauszahl! - v.anrechnung!
    },
    disclaimer: 'KSt 15% + Solidaritätszuschlag 5,5% auf KSt. Gewerbesteuer separat (§ GewStG).',
  },
  ESt: {
    titulo:     'Einkommensteuer',
    subtitulo:  'ESt Veranlagungszeitraum 2024 — Progressivtarif',
    currency:   'EUR',
    agencia:    'Finanzamt',
    agenciaUrl: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/einkommensteuer.html',
    fields: [
      { key: 'gesamtbetrag', label: 'Gesamtbetrag der Einkünfte',  hint: 'Summe alle Einkunftsarten' },
      { key: 'sonderausgaben', label: 'Sonderausgaben',             hint: 'Krankenversicherung, Vorsorge, Spenden', negate: true },
      { key: 'aussergewoehnlich', label: 'Außergewöhnliche Belastungen', negate: true },
      { key: 'vorauszahl',   label: 'Vorauszahlungen',              hint: 'Quartalsvorauszahlungen ESt', negate: true },
      { key: 'lohnsteuer',   label: 'Einbehaltene Lohnsteuer',      negate: true },
    ],
    disclaimer: 'ESt nach Grundtabelle 2024 (Grundfreibetrag: 11.784 €). Tarif bis 45%. Nur orientierend.',
  },
  GewSt: {
    titulo:     'Gewerbesteuer',
    subtitulo:  'GewSt Erhebungszeitraum 2024',
    currency:   'EUR',
    agencia:    'Gemeinde / Finanzamt',
    agenciaUrl: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/gewerbesteuer.html',
    fields: [
      { key: 'gewerbeertrag', label: 'Gewerbeertrag (nach Hinzurechnungen)', hint: 'Maßgeblicher Gewerbeertrag' },
      { key: 'freibetrag',    label: 'Freibetrag (§11 Abs.1 GewStG)',        hint: '24.500 € für Einzelunternehmen/Personenges.', negate: true },
      { key: 'steuermesszahl', label: 'Steuermesszahl × Hebesatz (€)',       hint: 'Messzahl 3,5% × Hebesatz Gemeinde' },
      { key: 'vorauszahl',    label: 'Vorauszahlungen',                       negate: true },
    ],
    calcResult: (v) => {
      const basis = Math.max(0, v.gewerbeertrag! - v.freibetrag!)
      const messbetrag = basis * 0.035
      return messbetrag * (v.steuermesszahl! / 100) - v.vorauszahl!
    },
    disclaimer: 'Hebesatz medio ~400% (varía por municipio). GmbH: sin freibetrag. Solo orientativo.',
  },
}

// ── Estados Unidos ────────────────────────────────────────────────────────────

const US_MODELS: CountryModels = {
  'Est. Tax': {
    titulo:     'Estimated Tax Payment',
    subtitulo:  'Federal quarterly estimated taxes — IRS Form 1040-ES',
    currency:   'USD',
    agencia:    'IRS',
    agenciaUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes',
    fields: [
      { key: 'expected_tax',   label: 'Expected annual tax liability', hint: 'Estimated total tax for the year' },
      { key: 'credits',        label: 'Credits (child, education…)',    negate: true },
      { key: 'prev_payments',  label: 'Payments made so far',          negate: true },
    ],
    calcResult: (v) => (v.expected_tax! - v.credits!) / 4 - v.prev_payments!,
    disclaimer: 'Safe harbor: pay 100% of prior-year tax (110% if AGI > $150k). Underpayment penalty may apply.',
  },
  '1040': {
    titulo:     'Form 1040 — Individual Income Tax',
    subtitulo:  'Annual individual return FY 2024',
    currency:   'USD',
    agencia:    'IRS',
    agenciaUrl: 'https://www.irs.gov/forms-pubs/about-form-1040',
    fields: [
      { key: 'gross_income',    label: 'Gross Income',                hint: 'W-2, 1099, Schedule C, etc.' },
      { key: 'adjustments',     label: 'Adjustments (AGI deductions)', negate: true },
      { key: 'std_deduction',   label: 'Standard deduction 2024',      hint: '$14 600 single / $29 200 MFJ', negate: true },
      { key: 'qbi_deduction',   label: 'QBI deduction (§199A)',        hint: '20% of qualified business income', negate: true },
      { key: 'withholding',     label: 'Taxes withheld (W-2/1099)',    negate: true },
      { key: 'est_payments',    label: 'Estimated tax payments made',  negate: true },
      { key: 'credits',         label: 'Tax credits',                  negate: true },
    ],
    disclaimer: 'Tax brackets 2024: 10%–37% federal. State taxes not included. Indicative only.',
  },
  '1120': {
    titulo:     'Form 1120 — Corporate Income Tax',
    subtitulo:  'C-Corporation annual return FY 2024',
    currency:   'USD',
    agencia:    'IRS',
    agenciaUrl: 'https://www.irs.gov/forms-pubs/about-form-1120',
    taxRate:    21,
    taxLabel:   'Corporate rate 21%',
    fields: [
      { key: 'gross_income',  label: 'Gross Income',                   hint: 'Total revenues from all sources' },
      { key: 'deductions',    label: 'Deductions (wages, COGS, depr.)', negate: true },
      { key: 'taxable_inc',   label: 'Taxable Income (computed)',       hint: 'Leave 0 to auto-calc from above' },
      { key: 'credits',       label: 'Tax credits (R&D, energy…)',      negate: true },
      { key: 'est_payments',  label: 'Estimated tax payments',          negate: true },
    ],
    calcResult: (v) => {
      const ti = v.taxable_inc! || Math.max(0, v.gross_income! - v.deductions!)
      return ti * 0.21 - v.credits! - v.est_payments!
    },
    disclaimer: 'Flat 21% federal corporate rate since TCJA 2017. State corporate taxes vary (0%–12%).',
  },
  '940': {
    titulo:     'Form 940 — FUTA Tax Return',
    subtitulo:  'Federal Unemployment Tax Act — annual',
    currency:   'USD',
    agencia:    'IRS',
    agenciaUrl: 'https://www.irs.gov/forms-pubs/about-form-940',
    taxRate:    6,
    taxLabel:   'FUTA 6% (net ~0.6% with SUTA credit)',
    fields: [
      { key: 'total_wages',   label: 'Total wages paid',           hint: 'All wages, salaries, other compensation' },
      { key: 'exempt_wages',  label: 'Exempt wages',               hint: 'Wages > $7,000 per employee', negate: true },
      { key: 'suta_credit',   label: 'SUTA credit (state paid)',   hint: 'Up to 5.4% if state payments timely', negate: true },
    ],
    calcResult: (v) => {
      const taxable = Math.max(0, v.total_wages! - v.exempt_wages!)
      return taxable * 0.06 - v.suta_credit!
    },
    disclaimer: 'Net FUTA rate ~0.6% with full SUTA credit. Taxable wage base: first $7,000 per employee.',
  },
  '941': {
    titulo:     'Form 941 — Employer\'s Quarterly Tax Return',
    subtitulo:  'Federal payroll taxes — quarterly filing',
    currency:   'USD',
    agencia:    'IRS',
    agenciaUrl: 'https://www.irs.gov/forms-pubs/about-form-941',
    fields: [
      { key: 'total_wages',     label: 'Total wages & tips',           hint: 'All compensation paid this quarter' },
      { key: 'federal_it',      label: 'Federal income tax withheld',  hint: 'From employees\' W-4 elections' },
      { key: 'ss_employee',     label: 'Social Security — employee',   hint: '6.2% × wages up to $168,600' },
      { key: 'ss_employer',     label: 'Social Security — employer',   hint: 'Matching 6.2%' },
      { key: 'medicare_ee',     label: 'Medicare — employee',          hint: '1.45% (+ 0.9% if wages > $200k)' },
      { key: 'medicare_er',     label: 'Medicare — employer',          hint: 'Matching 1.45%' },
      { key: 'deposits',        label: 'Tax deposits made',            negate: true },
      { key: 'credits',         label: 'Credits (COBRA, FMLA…)',       negate: true },
    ],
    calcResult: (v) => v.federal_it! + v.ss_employee! + v.ss_employer! + v.medicare_ee! + v.medicare_er! - v.deposits! - v.credits!,
    disclaimer: 'Deposit schedule (monthly vs semi-weekly) depends on lookback period tax liability.',
  },
}

// ── Canadá ────────────────────────────────────────────────────────────────────

const CA_MODELS: CountryModels = {
  'GST/HST': {
    titulo:     'GST/HST Return',
    subtitulo:  'Goods and Services Tax / Harmonized Sales Tax — quarterly',
    currency:   'CAD',
    agencia:    'CRA',
    agenciaUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html',
    fields: [
      { key: 'total_sales',  label: 'Total sales & other revenues',  hint: 'Line 101' },
      { key: 'gst_collected', label: 'GST/HST collected',            hint: 'Line 103 — 5% GST or provincial HST rate' },
      { key: 'itc',          label: 'Input Tax Credits (ITCs)',       hint: 'Line 106 — GST/HST on business purchases', negate: true },
      { key: 'adjustments',  label: 'Adjustments',                   hint: 'Line 104/107', negate: true },
    ],
    calcResult: (v) => v.gst_collected! - v.itc! - v.adjustments!,
    disclaimer: 'GST 5% federal. HST rates: ON 13%, BC/MB/QC have provincial component. File via CRA My Business Account.',
  },
  T1: {
    titulo:     'T1 — Personal Income Tax Return',
    subtitulo:  'Individual return FY 2024',
    currency:   'CAD',
    agencia:    'CRA',
    agenciaUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return.html',
    fields: [
      { key: 'total_income',    label: 'Total income (line 15000)',     hint: 'Employment, self-employment, investment' },
      { key: 'deductions',      label: 'Deductions (line 23300)',        hint: 'RRSP, union dues, childcare, etc.', negate: true },
      { key: 'basic_personal',  label: 'Basic personal amount',          hint: '$15,705 for 2024', negate: true },
      { key: 'withheld',        label: 'Tax withheld (T4 Box 22)',       negate: true },
      { key: 'installments',    label: 'Instalment payments made',       negate: true },
      { key: 'credits',         label: 'Non-refundable credits',         negate: true },
    ],
    disclaimer: 'Federal rates 15%–33%. Provincial taxes additional (varies by province). Indicative only.',
  },
  T2: {
    titulo:     'T2 — Corporate Income Tax Return',
    subtitulo:  'Corporation return FY ended 2024',
    currency:   'CAD',
    agencia:    'CRA',
    agenciaUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/corporation-income-tax-return.html',
    taxRate:    15,
    taxLabel:   'Federal rate 15% (SBD 9%)',
    fields: [
      { key: 'net_income',    label: 'Net income for tax purposes',   hint: 'Schedule 1 reconciliation' },
      { key: 'sbd_income',    label: 'Income eligible for SBD',       hint: 'Active business income (CCPCs, max $500k)' },
      { key: 'dividends_ded', label: 'Dividends deduction',           hint: 'Inter-corporate dividends', negate: true },
      { key: 'installments',  label: 'Instalment payments made',      negate: true },
      { key: 'credits',       label: 'Tax credits (SR&ED, etc.)',      negate: true },
    ],
    calcResult: (v) => {
      const sbd = Math.min(v.sbd_income! || 0, 500000) * 0.09
      const general = Math.max(0, (v.net_income! - v.dividends_ded!) - (v.sbd_income! || 0)) * 0.15
      return sbd + general - v.installments! - v.credits!
    },
    disclaimer: 'CCPC Small Business Deduction: 9% on first $500k active income. General rate 15%. Prov. taxes separate.',
  },
  T4: {
    titulo:     'T4 — Statement of Remuneration Paid',
    subtitulo:  'Annual employer information slip — CRA deadline Feb 28',
    currency:   'CAD',
    agencia:    'CRA',
    agenciaUrl: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001.html',
    fields: [
      { key: 'employment_income', label: 'Employment income (Box 14)',   hint: 'Total salaries, wages, tips' },
      { key: 'cpp_ee',            label: 'CPP contributions (Box 16)',   hint: 'Employee CPP deducted' },
      { key: 'ei_ee',             label: 'EI premiums (Box 18)',         hint: 'Employee EI deducted' },
      { key: 'income_tax',        label: 'Income tax deducted (Box 22)', hint: 'Federal + provincial withheld' },
      { key: 'cpp_er',            label: 'Employer CPP matching',        hint: 'Employer share of CPP' },
      { key: 'ei_er',             label: 'Employer EI matching',         hint: 'Employer share ×1.4' },
    ],
    calcResult: (v) => v.cpp_er! + v.ei_er! + v.income_tax!,
    disclaimer: 'T4 is an information slip — total employer remittances = CPP×2 + EI employer + income tax withheld.',
  },
}

// ── Israel ────────────────────────────────────────────────────────────────────

const IL_MODELS: CountryModels = {
  VAT: {
    titulo:     'מע"מ — VAT Return',
    subtitulo:  'Value Added Tax bimonthly return — Israel Tax Authority',
    currency:   'ILS',
    agencia:    'Israel Tax Authority',
    agenciaUrl: 'https://www.gov.il/en/departments/israel_tax_authority',
    fields: [
      { key: 'taxable_sales', label: 'Taxable sales (output VAT base)', hint: 'Total sales subject to VAT 17%' },
      { key: 'vat_collected', label: 'VAT collected (17%)',             hint: 'Output tax' },
      { key: 'vat_paid',      label: 'VAT paid on inputs',              hint: 'Input tax (purchases, expenses)', negate: true },
      { key: 'vat_refund',    label: 'Prior period credit',             hint: 'Excess from last period', negate: true },
    ],
    calcResult: (v) => v.vat_collected! - v.vat_paid! - v.vat_refund!,
    disclaimer: 'VAT rate: 17%. Bimonthly filing for most businesses. Monthly for large businesses. File via Shaam Online.',
  },
  'Corp Tax': {
    titulo:     'מס חברות — Corporate Income Tax',
    subtitulo:  'Annual corporate tax return FY 2024 — rate 23%',
    currency:   'ILS',
    agencia:    'Israel Tax Authority',
    agenciaUrl: 'https://www.gov.il/en/departments/israel_tax_authority',
    taxRate:    23,
    taxLabel:   'Corporate tax 23%',
    fields: [
      { key: 'taxable_income', label: 'Taxable income',                 hint: 'Net profit adjusted for tax purposes' },
      { key: 'losses_cf',      label: 'Loss carryforward',              negate: true },
      { key: 'credits',        label: 'Tax credits',                    hint: 'R&D, investments in periphery, etc.', negate: true },
      { key: 'advance_payments', label: 'Advance tax payments (Mekadmot)', negate: true },
      { key: 'withholding',    label: 'Withholding tax deducted',       negate: true },
    ],
    calcResult: (v) => Math.max(0, v.taxable_income! - v.losses_cf!) * 0.23 - v.credits! - v.advance_payments! - v.withholding!,
    disclaimer: 'Corporate tax rate: 23% (flat). Preferred enterprise: 16%/7%. File annual return by April 30.',
  },
  'Mas Hachnasa': {
    titulo:     'מס הכנסה — Personal Income Tax',
    subtitulo:  'Annual individual income tax return FY 2024',
    currency:   'ILS',
    agencia:    'Israel Tax Authority',
    agenciaUrl: 'https://www.gov.il/en/departments/israel_tax_authority',
    fields: [
      { key: 'gross_income',   label: 'Gross income',                   hint: 'All income sources (self-employment, salary, etc.)' },
      { key: 'deductions',     label: 'Recognized deductions',          hint: 'Business expenses, pension contributions', negate: true },
      { key: 'tax_points',     label: 'Tax credits (tax points × 235)', hint: 'Each point = ₪235/month = ₪2,820/year', negate: true },
      { key: 'withheld',       label: 'Tax withheld at source',         negate: true },
      { key: 'advance_payments', label: 'Advance payments (Mekadmot)', negate: true },
    ],
    disclaimer: 'Progressive rates 10%–47% (2024). Significant credits per tax points. Indicative only.',
  },
  Mekadmot: {
    titulo:     'מקדמות — Advance Income Tax Payments',
    subtitulo:  'Monthly advance payments — self-employed & companies',
    currency:   'ILS',
    agencia:    'Israel Tax Authority',
    agenciaUrl: 'https://www.gov.il/en/departments/israel_tax_authority',
    fields: [
      { key: 'monthly_revenue', label: 'Monthly business revenue',      hint: 'Gross turnover this month' },
      { key: 'advance_rate',    label: 'Your advance rate (%)',          hint: 'Set by ITA based on prior year' },
      { key: 'vat_component',   label: 'Less: VAT collected',           hint: 'If revenue is VAT-inclusive', negate: true },
    ],
    calcResult: (v) => (v.monthly_revenue! - v.vat_component!) * (v.advance_rate! / 100),
    disclaimer: 'Advance rate set by Israel Tax Authority based on prior year effective rate. Pay by 15th of following month.',
  },
}

// ── Mapa completo ─────────────────────────────────────────────────────────────

export const ALL_MODELS: Partial<Record<Country, CountryModels>> = {
  FR: FR_MODELS,
  PT: PT_MODELS,
  IT: IT_MODELS,
  BE: BE_MODELS,
  DE: DE_MODELS,
  US: US_MODELS,
  CA: CA_MODELS,
  IL: IL_MODELS,
}

export function getModelConfig(country: string, modelo: string): ModelConfig | null {
  const countryModels = ALL_MODELS[country as Country]
  if (!countryModels) return null
  return countryModels[modelo] ?? null
}

export function getCountryModels(country: string): string[] {
  const countryModels = ALL_MODELS[country as Country]
  if (!countryModels) return []
  return Object.keys(countryModels)
}
