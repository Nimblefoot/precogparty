const ROSE600 = [347, 77, 50]

const LIME600 = [85, 85, 35]

const interpolateOddsColors = (percentOdds: number, a = 1) => {
  const H = (ROSE600[0] * (100 - percentOdds) + LIME600[0] * percentOdds) / 100
  const S = (ROSE600[1] * (100 - percentOdds) + LIME600[1] * percentOdds) / 100
  const L = (ROSE600[2] * (100 - percentOdds) + LIME600[2] * percentOdds) / 100
  return `hsla(${H}, ${S}%, ${L}%, ${a})`
}

export default interpolateOddsColors
