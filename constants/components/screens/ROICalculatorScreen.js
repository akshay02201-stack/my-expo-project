// ═══════════════════════════════════════════════════════════════
//  ROICalculatorScreen — Green Real Estate ROI Calculator
//
//  Inputs:
//  • Flat size (sqft) via stepper
//  • Price per sqft via stepper
//  • Loan % via stepper
//  • Interest rate via stepper
//  • Loan tenure via stepper
//  • Rental yield % via stepper
//  • Appreciation % p.a. via stepper
//  • Holding period via stepper
//  • Green certified toggle (+8% rent, +1.5% appreciation, ₹4,500/mo savings)
//
//  Outputs (real-time):
//  • Property price
//  • Down payment + Loan amount
//  • Monthly EMI
//  • Monthly rent vs EMI cash-flow
//  • Green savings p.a.
//  • Total rental income (holding period)
//  • Future property value
//  • Capital gain
//  • Net return (5-year)
//  • Total ROI %
//  • Payback period
// ═══════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS, SPACE, RADIUS,
  formatPrice, formatINR, formatCompact,
} from '../constants/theme';
import { ROI_DEFAULTS, GREEN_PREMIUM, PROJECTS } from '../constants/data';

const { width: W } = Dimensions.get('window');


// ═══════════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════════

/** Section heading */
function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/** +/- stepper row */
function Stepper({ label, value, unit, step, min, max, decimals = 0, onChange }) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  const dec = () => onChange(Math.max(min, parseFloat((value - step).toFixed(decimals))));
  const inc = () => onChange(Math.min(max, parseFloat((value + step).toFixed(decimals))));

  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepBtn} onPress={dec} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepValue}>
          <Text style={styles.stepValueText}>{display}{unit}</Text>
        </View>
        <TouchableOpacity style={styles.stepBtn} onPress={inc} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Result row in the output table */
function ResultRow({ label, value, sub, highlight }) {
  return (
    <View style={[styles.resultRow, highlight && styles.resultRowHighlight]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.resultLabel, highlight && { color: COLORS.text }]}>{label}</Text>
        {sub && <Text style={styles.resultSub}>{sub}</Text>}
      </View>
      <Text style={[styles.resultValue, highlight && { color: COLORS.cyan }]}>
        {value}
      </Text>
    </View>
  );
}

/** Quick-fill preset button */
function PresetBtn({ emoji, label, price, onPress }) {
  return (
    <TouchableOpacity style={styles.presetBtn} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.presetEmoji}>{emoji}</Text>
      <Text style={styles.presetLabel}>{label}</Text>
      <Text style={styles.presetPrice}>{price}</Text>
    </TouchableOpacity>
  );
}


// ═══════════════════════════════════════════════════════════════
//  Main Screen
// ═══════════════════════════════════════════════════════════════
export default function ROICalculatorScreen() {
  // ── Inputs ─────────────────────────────────────────────────
  const [sqft,        setSqft]        = useState(ROI_DEFAULTS.flatSizeSqft);
  const [psf,         setPsf]         = useState(ROI_DEFAULTS.pricePerSqft);
  const [loanPct,     setLoanPct]     = useState(ROI_DEFAULTS.loanPercent);
  const [intRate,     setIntRate]     = useState(ROI_DEFAULTS.interestRate);
  const [tenure,      setTenure]      = useState(ROI_DEFAULTS.loanTenureYrs);
  const [rentalYield, setRentalYield] = useState(ROI_DEFAULTS.rentalYield);
  const [appreciation,setAppreciation]= useState(ROI_DEFAULTS.appreciation);
  const [holdYears,   setHoldYears]   = useState(ROI_DEFAULTS.holdingYears);
  const [greenOn,     setGreenOn]     = useState(ROI_DEFAULTS.greenBonus);

  // ── Presets ────────────────────────────────────────────────
  const applyPreset = (flatSqft, flatPsf) => {
    setSqft(flatSqft);
    setPsf(flatPsf);
  };

  // ── Calculation engine ─────────────────────────────────────
  const calc = useMemo(() => {
    const propVal  = sqft * psf;

    // Green adjustments
    const effectiveYield = rentalYield * (greenOn ? (1 + GREEN_PREMIUM.rentalPremium) : 1);
    const effectiveApprec= appreciation + (greenOn ? GREEN_PREMIUM.appreciationBonus * 100 : 0);
    const greenSavings   = greenOn ? GREEN_PREMIUM.monthlySavings : 0; // ₹/month utility savings

    // Loan
    const loanAmt  = propVal * (loanPct / 100);
    const downPay  = propVal - loanAmt;

    // EMI formula: P × r × (1+r)^n / ((1+r)^n − 1)
    const r        = intRate / 100 / 12;
    const n        = tenure * 12;
    const emi      = loanAmt > 0
      ? (loanAmt * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : 0;

    // Rental income
    const annualRent   = propVal * (effectiveYield / 100);
    const monthlyRent  = annualRent / 12;

    // Future value
    const appMulti     = Math.pow(1 + effectiveApprec / 100, holdYears);
    const futureVal    = propVal * appMulti;
    const capitalGain  = futureVal - propVal;

    // Total rental over holding period
    const totalRental  = annualRent * holdYears;

    // Total EMI paid during holding period
    const totalEmi     = emi * 12 * Math.min(holdYears, tenure);

    // Green savings over holding period
    const totalGreenSavings = greenSavings * 12 * holdYears;

    // Net profit
    // (Capital gain + Total rent + Utility savings) − (Down payment invested + EMI paid − loan principal recovered)
    const loanRepaid   = loanAmt * (Math.min(holdYears, tenure) / tenure);
    const totalInvested= downPay + totalEmi - loanRepaid;
    const netReturn    = capitalGain + totalRental + totalGreenSavings;
    const roi          = totalInvested > 0 ? (netReturn / downPay) * 100 : 0;

    // Payback period (down-payment / annual net cashflow)
    const annualCashflow = annualRent + (greenSavings * 12) - (emi * 12);
    const payback        = annualCashflow > 0
      ? (downPay / annualCashflow)
      : null;

    // Monthly cash-flow summary
    const monthlyCashflow = monthlyRent + greenSavings - emi;

    return {
      propVal,
      downPay,
      loanAmt,
      emi,
      monthlyRent,
      greenSavings,
      monthlyCashflow,
      annualRent,
      totalRental,
      futureVal,
      capitalGain,
      totalGreenSavings,
      netReturn,
      roi,
      payback,
      effectiveYield: effectiveYield.toFixed(2),
      effectiveApprec: effectiveApprec.toFixed(2),
    };
  }, [sqft, psf, loanPct, intRate, tenure, rentalYield, appreciation, holdYears, greenOn]);

  // Cash-flow positive?
  const cashPositive = calc.monthlyCashflow >= 0;

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─── Page title ─── */}
        <Text style={styles.pageTitle}>ROI Calculator</Text>
        <Text style={styles.pageSubtitle}>
          Estimate returns for Noida & Greater Noida real estate
        </Text>

        {/* ─── Quick Presets ─── */}
        <SectionLabel>Quick Presets</SectionLabel>
        <View style={styles.presetsRow}>
          <PresetBtn emoji="🏠" label="Budget 2 BHK" price="~₹42L"
            onPress={() => applyPreset(808,  5200)} />
          <PresetBtn emoji="🏡" label="Mid-range 3 BHK" price="~₹85L"
            onPress={() => applyPreset(1148, 7400)} />
          <PresetBtn emoji="🏢" label="Premium 3 BHK" price="~₹1.4Cr"
            onPress={() => applyPreset(1550, 8800)} />
        </View>

        {/* ─── Property inputs ─── */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>🏗️ Property Details</Text>

          <Stepper
            label="Flat Size"
            value={sqft} unit=" sqft"
            step={50} min={400} max={5000}
            onChange={setSqft}
          />
          <View style={styles.inputDivider} />

          <Stepper
            label="Price per Sqft"
            value={psf} unit=" ₹"
            step={100} min={2000} max={20000}
            onChange={setPsf}
          />
          <View style={styles.inputDivider} />

          {/* Computed price display */}
          <View style={styles.computedRow}>
            <Text style={styles.computedLabel}>Total Property Price</Text>
            <Text style={styles.computedValue}>{formatPrice(calc.propVal)}</Text>
          </View>
        </View>

        {/* ─── Loan inputs ─── */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>🏦 Home Loan</Text>

          <Stepper
            label="Loan %" value={loanPct} unit="%"
            step={5} min={0} max={90}
            onChange={setLoanPct}
          />
          <View style={styles.inputDivider} />

          <Stepper
            label="Interest Rate" value={intRate} unit="% p.a."
            step={0.25} min={6} max={15} decimals={2}
            onChange={setIntRate}
          />
          <View style={styles.inputDivider} />

          <Stepper
            label="Loan Tenure" value={tenure} unit=" yrs"
            step={5} min={5} max={30}
            onChange={setTenure}
          />

          <View style={[styles.inputDivider, { marginTop: SPACE.sm }]} />

          {/* Quick computed summary */}
          <View style={styles.loanSummary}>
            <View style={styles.loanSummaryItem}>
              <Text style={styles.loanSummaryVal}>{formatCompact(calc.downPay)}</Text>
              <Text style={styles.loanSummaryKey}>Down Payment</Text>
            </View>
            <View style={styles.loanSummaryDivider} />
            <View style={styles.loanSummaryItem}>
              <Text style={styles.loanSummaryVal}>{formatCompact(calc.loanAmt)}</Text>
              <Text style={styles.loanSummaryKey}>Loan Amount</Text>
            </View>
            <View style={styles.loanSummaryDivider} />
            <View style={styles.loanSummaryItem}>
              <Text style={[styles.loanSummaryVal, { color: COLORS.gold }]}>
                {formatINR(calc.emi)}/mo
              </Text>
              <Text style={styles.loanSummaryKey}>Monthly EMI</Text>
            </View>
          </View>
        </View>

        {/* ─── Returns inputs ─── */}
        <View style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>📈 Return Assumptions</Text>

          <Stepper
            label="Rental Yield" value={rentalYield} unit="% p.a."
            step={0.1} min={1} max={10} decimals={1}
            onChange={setRentalYield}
          />
          <View style={styles.inputDivider} />

          <Stepper
            label="Appreciation" value={appreciation} unit="% p.a."
            step={0.5} min={2} max={20} decimals={1}
            onChange={setAppreciation}
          />
          <View style={styles.inputDivider} />

          <Stepper
            label="Holding Period" value={holdYears} unit=" yrs"
            step={1} min={1} max={30}
            onChange={setHoldYears}
          />

          {/* Green Certified toggle */}
          <View style={styles.inputDivider} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>🌿 Green Certified Building</Text>
              <Text style={styles.toggleSub}>
                +8% rental premium · +1.5% appreciation · ₹4,500/mo utility savings
              </Text>
            </View>
            <Switch
              value={greenOn}
              onValueChange={setGreenOn}
              trackColor={{ false: COLORS.border, true: COLORS.cyan }}
              thumbColor={greenOn ? COLORS.white : COLORS.textMid}
              ios_backgroundColor={COLORS.border}
            />
          </View>

          {greenOn && (
            <View style={styles.greenBonusInfo}>
              <Text style={styles.greenBonusText}>
                ✅ Green premium applied:{'\n'}
                Effective yield: {calc.effectiveYield}% p.a.  ·  Appreciation: {calc.effectiveApprec}% p.a.{'\n'}
                Utility savings: ₹4,500/mo (₹{(GREEN_PREMIUM.monthlySavings * 12 * holdYears).toLocaleString('en-IN')} over {holdYears} yrs)
              </Text>
            </View>
          )}
        </View>

        {/* ─── Results ─── */}
        <SectionLabel>📊 Investment Results</SectionLabel>

        {/* Cash-flow summary banner */}
        <View style={[
          styles.cashflowBanner,
          cashPositive ? styles.cashflowPos : styles.cashflowNeg,
        ]}>
          <Text style={styles.cashflowBannerTitle}>
            {cashPositive ? '✅ Positive Cash Flow' : '⚠ Negative Cash Flow'}
          </Text>
          <Text style={[
            styles.cashflowBannerVal,
            { color: cashPositive ? COLORS.aqiGood : COLORS.aqiSensitive },
          ]}>
            {formatINR(Math.abs(calc.monthlyCashflow))}/month {cashPositive ? 'surplus' : 'shortfall'}
          </Text>
          <Text style={styles.cashflowBannerSub}>
            Rent {formatINR(calc.monthlyRent)}
            {greenOn ? ` + Savings ${formatINR(calc.greenSavings)}` : ''}
            {' − '} EMI {formatINR(calc.emi)}
          </Text>
        </View>

        {/* Full results table */}
        <View style={styles.resultsCard}>
          <ResultRow
            label="Property Price"
            value={formatPrice(calc.propVal)}
          />
          <ResultRow
            label="Down Payment (equity)"
            value={formatCompact(calc.downPay)}
          />
          <ResultRow
            label="Monthly EMI"
            value={`${formatINR(calc.emi)}/mo`}
          />
          <ResultRow
            label="Monthly Rent Estimate"
            value={`${formatINR(calc.monthlyRent)}/mo`}
            sub={`At effective yield of ${calc.effectiveYield}%`}
          />
          {greenOn && (
            <ResultRow
              label="Green Utility Savings"
              value={`${formatINR(calc.greenSavings)}/mo`}
              sub="Solar, HVAC, water savings estimate"
            />
          )}
          <ResultRow
            label={`Total Rental (${holdYears} yrs)`}
            value={formatCompact(calc.totalRental)}
          />
          {greenOn && (
            <ResultRow
              label={`Green Savings (${holdYears} yrs)`}
              value={formatCompact(calc.totalGreenSavings)}
            />
          )}
          <ResultRow
            label={`Future Property Value`}
            value={formatCompact(calc.futureVal)}
            sub={`After ${holdYears} yrs at ${calc.effectiveApprec}% p.a.`}
          />
          <ResultRow
            label="Capital Gain"
            value={formatCompact(calc.capitalGain)}
          />
          <ResultRow
            label={`Net Return (${holdYears} yrs)`}
            value={formatCompact(calc.netReturn)}
            sub="Capital gain + rent + green savings"
            highlight
          />
          <ResultRow
            label="Total ROI on Equity"
            value={`${calc.roi.toFixed(1)}%`}
            sub={`Return on down payment of ${formatCompact(calc.downPay)}`}
            highlight
          />
          <ResultRow
            label="Payback Period"
            value={
              calc.payback != null
                ? `${calc.payback.toFixed(1)} yrs`
                : 'Cashflow negative'
            }
            sub="Time for rent + savings to recover equity"
            highlight={calc.payback != null}
          />
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          * All figures are estimates based on your inputs and typical market assumptions.
          Actual returns depend on occupancy rates, market conditions, maintenance costs,
          taxes, and local regulations. Consult a SEBI-registered financial advisor before
          making investment decisions.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}


// ═══════════════════════════════════════════════════════════════
//  Styles
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACE.md, paddingBottom: 64 },

  pageTitle:    { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: -0.8 },
  pageSubtitle: { fontSize: 12, color: COLORS.textMid, marginTop: 3, marginBottom: SPACE.md },

  sectionLabel: {
    fontSize:      11,
    fontWeight:    '700',
    color:         COLORS.textDim,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom:  SPACE.sm,
    marginTop:     SPACE.sm,
  },

  // Presets
  presetsRow: { flexDirection: 'row', gap: SPACE.sm, marginBottom: SPACE.md },
  presetBtn: {
    flex:            1,
    backgroundColor: COLORS.card,
    borderRadius:    RADIUS.lg,
    padding:         SPACE.sm + 2,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
    gap:             3,
  },
  presetEmoji: { fontSize: 22 },
  presetLabel: { color: COLORS.textMid, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  presetPrice: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },

  // Input cards
  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius:    RADIUS.xl,
    padding:         SPACE.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACE.md,
  },
  inputCardTitle: {
    fontSize:      14,
    fontWeight:    '800',
    color:         COLORS.text,
    marginBottom:  SPACE.md,
    letterSpacing: -0.2,
  },
  inputDivider: { height: 1, backgroundColor: COLORS.borderSoft, marginVertical: SPACE.sm },

  // Stepper
  stepperRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs,
  },
  stepperLabel:    { color: COLORS.text, fontSize: 14, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  stepBtn: {
    width:           34,
    height:          34,
    borderRadius:    RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  stepBtnText:  { color: COLORS.text, fontSize: 20, fontWeight: '600', lineHeight: 26 },
  stepValue: {
    minWidth:        88,
    alignItems:      'center',
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.sm,
    paddingHorizontal: SPACE.sm,
    paddingVertical:   SPACE.sm - 2,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  stepValueText: { color: COLORS.cyan, fontWeight: '700', fontSize: 13 },

  // Computed row
  computedRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    backgroundColor: COLORS.surface,
    borderRadius:   RADIUS.md,
    padding:        SPACE.md,
    marginTop:      SPACE.sm,
    borderWidth:    1,
    borderColor:    COLORS.goldDim,
  },
  computedLabel: { color: COLORS.textMid, fontSize: 13 },
  computedValue: { color: COLORS.gold, fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },

  // Loan summary
  loanSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius:  RADIUS.md,
    padding:       SPACE.md,
    marginTop:     SPACE.sm,
    borderWidth:   1,
    borderColor:   COLORS.border,
  },
  loanSummaryItem:    { flex: 1, alignItems: 'center' },
  loanSummaryVal:     { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  loanSummaryKey:     { color: COLORS.textDim, fontSize: 9, marginTop: 3, textTransform: 'uppercase' },
  loanSummaryDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  // Toggle
  toggleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: SPACE.xs + 2,
  },
  toggleLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  toggleSub:   { color: COLORS.cyan, fontSize: 11, lineHeight: 16 },

  // Green bonus info
  greenBonusInfo: {
    backgroundColor: COLORS.cyanDim,
    borderRadius:    RADIUS.md,
    padding:         SPACE.sm + 2,
    marginTop:       SPACE.sm,
    borderWidth:     1,
    borderColor:     COLORS.cyanMid,
  },
  greenBonusText: { color: COLORS.cyan, fontSize: 11, lineHeight: 18 },

  // Cash-flow banner
  cashflowBanner: {
    borderRadius:    RADIUS.xl,
    padding:         SPACE.md,
    marginBottom:    SPACE.md,
    alignItems:      'center',
    borderWidth:     1,
    gap:             3,
  },
  cashflowPos: {
    backgroundColor: COLORS.aqiBgGood,
    borderColor:     COLORS.aqiGood + '40',
  },
  cashflowNeg: {
    backgroundColor: COLORS.aqiBgSensitive,
    borderColor:     COLORS.aqiSensitive + '40',
  },
  cashflowBannerTitle: { color: COLORS.textMid, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cashflowBannerVal:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  cashflowBannerSub:   { color: COLORS.textDim, fontSize: 11, textAlign: 'center' },

  // Results table
  resultsCard: {
    backgroundColor: COLORS.card,
    borderRadius:    RADIUS.xl,
    borderWidth:     1,
    borderColor:     COLORS.border,
    overflow:        'hidden',
    marginBottom:    SPACE.md,
  },
  resultRow: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: SPACE.md,
    paddingVertical:  11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  resultRowHighlight: { backgroundColor: COLORS.cyanDim },
  resultLabel: { color: COLORS.textMid, fontSize: 13 },
  resultSub:   { color: COLORS.textDim, fontSize: 10, marginTop: 2 },
  resultValue: { color: COLORS.text, fontWeight: '700', fontSize: 14 },

  // Disclaimer
  disclaimer: {
    color:     COLORS.textDim,
    fontSize:  11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: SPACE.sm,
    marginTop: SPACE.sm,
  },
});