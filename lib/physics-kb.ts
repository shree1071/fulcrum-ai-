export interface PhysicsKBEntry {
  equations: string[];
  defaults: Record<string, number>;
  thresholds: Record<string, { warning: number; critical: number }>;
  sources: string[];
  parameterNames: string[];
}

export const physicsKB: Record<string, PhysicsKBEntry> = {
  wind_turbine: {
    equations: [
      "P = ½ρAv³ × Cp",
      "Betz limit: Cp_max = 16/27 ≈ 0.593",
      "TSR = ωr/v (Tip Speed Ratio)",
      "Centrifugal stress: σ = ρω²r²"
    ],
    defaults: {
      bladeLength: 45,
      rotationSpeed: 15,
      windSpeed: 12,
      numberOfBlades: 3,
      pitchAngle: 6
    },
    thresholds: {
      rotationSpeed: { warning: 18, critical: 25 },
      windSpeed: { warning: 20, critical: 30 }
    },
    sources: ["Betz 1919", "IEC 61400-1"],
    parameterNames: ["bladeLength", "rotationSpeed", "windSpeed", "numberOfBlades", "pitchAngle"]
  },
  
  newton_cradle: {
    equations: [
      "Conservation of momentum: m₁v₁ = m₂v₂",
      "Elastic collision: v₁' = ((m₁-m₂)/(m₁+m₂))v₁",
      "Coefficient of restitution: e = v_separation/v_approach",
      "Potential energy: PE = mgh = mgL(1-cosθ)"
    ],
    defaults: {
      ballMass: 0.5,
      stringLength: 0.3,
      releaseAngle: 30,
      numberOfBalls: 5,
      restitution: 0.95
    },
    thresholds: {
      releaseAngle: { warning: 45, critical: 60 },
      restitution: { warning: 0.98, critical: 1.0 }
    },
    sources: ["Newton's Principia", "Goldstein Classical Mechanics"],
    parameterNames: ["ballMass", "stringLength", "releaseAngle", "numberOfBalls", "restitution"]
  },
  
  rocket: {
    equations: [
      "Tsiolkovsky: Δv = ve × ln(m₀/mf)",
      "Thrust: F = ṁ × ve",
      "Thrust-to-weight ratio: TWR = F/(m×g)",
      "Burn time: tb = mfuel/ṁ"
    ],
    defaults: {
      fuelMass: 1000,
      exhaustVelocity: 3000,
      thrustForce: 15000,
      payloadMass: 500,
      burnTime: 120
    },
    thresholds: {
      thrustForce: { warning: 25000, critical: 35000 },
      exhaustVelocity: { warning: 4500, critical: 6000 }
    },
    sources: ["Tsiolkovsky 1903", "Sutton Rocket Propulsion"],
    parameterNames: ["fuelMass", "exhaustVelocity", "thrustForce", "payloadMass", "burnTime"]
  },
  
  projectile: {
    equations: [
      "Range: R = (v₀²sin(2θ))/g",
      "Max height: h = (v₀²sin²θ)/(2g)",
      "Drag force: Fd = ½ρCdAv²",
      "Terminal velocity: vt = √(2mg/(ρCdA))"
    ],
    defaults: {
      initialVelocity: 50,
      launchAngle: 45,
      mass: 1.0,
      dragCoefficient: 0.47,
      gravity: 9.81
    },
    thresholds: {
      initialVelocity: { warning: 100, critical: 150 },
      launchAngle: { warning: 80, critical: 89 }
    },
    sources: ["Galileo Discorsi", "Halliday & Resnick"],
    parameterNames: ["initialVelocity", "launchAngle", "mass", "dragCoefficient", "gravity"]
  },
  
  spring_mass: {
    equations: [
      "Hooke's law: F = -kx",
      "Angular frequency: ω = √(k/m)",
      "Damped oscillation: x(t) = Ae^(-γt)cos(ωt + φ)",
      "Damping ratio: ζ = c/(2√(km))"
    ],
    defaults: {
      springConstant: 100,
      mass: 2.0,
      dampingCoefficient: 0.5,
      amplitude: 0.1,
      frequency: 1.0
    },
    thresholds: {
      amplitude: { warning: 0.5, critical: 1.0 },
      frequency: { warning: 5.0, critical: 10.0 }
    },
    sources: ["Hooke 1678", "Landau & Lifshitz Mechanics"],
    parameterNames: ["springConstant", "mass", "dampingCoefficient", "amplitude", "frequency"]
  },
  
  orbital: {
    equations: [
      "Vis-viva: v² = GM(2/r - 1/a)",
      "Orbital period: T = 2π√(a³/GM)",
      "Escape velocity: ve = √(2GM/r)",
      "Specific orbital energy: ε = -GM/(2a)"
    ],
    defaults: {
      centralMass: 5.972e24,
      orbitRadius: 6.771e6,
      orbitalVelocity: 7700,
      eccentricity: 0.0,
      inclination: 0
    },
    thresholds: {
      orbitalVelocity: { warning: 10000, critical: 11200 },
      eccentricity: { warning: 0.7, critical: 0.95 }
    },
    sources: ["Kepler's Laws", "Newton's Principia"],
    parameterNames: ["centralMass", "orbitRadius", "orbitalVelocity", "eccentricity", "inclination"]
  },
  
  bridge: {
    equations: [
      "Bending moment: M = FL/4 (simply supported)",
      "Bending stress: σ = My/I",
      "Deflection: δ = FL³/(48EI)",
      "Section modulus: S = I/y"
    ],
    defaults: {
      spanLength: 50,
      loadForce: 10000,
      beamDepth: 2.0,
      materialStrength: 250e6,
      numberOfSupports: 2
    },
    thresholds: {
      loadForce: { warning: 20000, critical: 30000 },
      spanLength: { warning: 80, critical: 100 }
    },
    sources: ["Euler-Bernoulli beam theory", "Timoshenko Strength of Materials"],
    parameterNames: ["spanLength", "loadForce", "beamDepth", "materialStrength", "numberOfSupports"]
  },
  
  water_bottle: {
    equations: [
      "Hoop stress: σh = Pr/t",
      "Longitudinal stress: σl = Pr/(2t)",
      "Von Mises stress: σvm = √(σh² - σhσl + σl²)",
      "Burst pressure: Pb = 2σyt/r"
    ],
    defaults: {
      wallThickness: 0.002,
      internalPressure: 200000,
      bottleRadius: 0.04,
      materialStrength: 50e6,
      fillLevel: 0.8
    },
    thresholds: {
      internalPressure: { warning: 400000, critical: 600000 },
      wallThickness: { warning: 0.0015, critical: 0.001 }
    },
    sources: ["Barlow's formula", "Roark's Formulas for Stress"],
    parameterNames: ["wallThickness", "internalPressure", "bottleRadius", "materialStrength", "fillLevel"]
  },
  
  robotic_arm: {
    equations: [
      "Forward kinematics: x = l₁cosθ₁ + l₂cos(θ₁+θ₂)",
      "Torque: τ = r × F",
      "Joint torque: τj = Iα + mgl×sin(θ)",
      "Payload capacity: Fmax = τmax/r"
    ],
    defaults: {
      link1Length: 0.5,
      link2Length: 0.4,
      jointAngle1: 45,
      jointAngle2: 30,
      payloadMass: 2.0,
      motorTorque: 10
    },
    thresholds: {
      payloadMass: { warning: 5.0, critical: 8.0 },
      motorTorque: { warning: 15, critical: 20 }
    },
    sources: ["Denavit-Hartenberg parameters", "Craig Robotics"],
    parameterNames: ["link1Length", "link2Length", "jointAngle1", "jointAngle2", "payloadMass", "motorTorque"]
  }
};

export function lookupDomain(topic: string): PhysicsKBEntry | null {
  const topicLower = topic.toLowerCase();
  
  // Direct keyword matching
  const keywords: Record<string, string[]> = {
    wind_turbine: ["wind", "turbine", "blade", "renewable", "generator"],
    newton_cradle: ["newton", "cradle", "pendulum", "collision", "momentum"],
    rocket: ["rocket", "propulsion", "thrust", "space", "launch"],
    projectile: ["projectile", "trajectory", "ballistic", "throw", "cannon"],
    spring_mass: ["spring", "oscillator", "harmonic", "damping", "vibration"],
    orbital: ["orbit", "satellite", "planet", "kepler", "gravity"],
    bridge: ["bridge", "beam", "structure", "load", "span"],
    water_bottle: ["bottle", "pressure", "vessel", "container", "hoop"],
    robotic_arm: ["robot", "arm", "manipulator", "joint", "kinematics"]
  };
  
  for (const [simType, words] of Object.entries(keywords)) {
    if (words.some(word => topicLower.includes(word))) {
      return physicsKB[simType];
    }
  }
  
  return null;
}

export function classifySimType(topic: string): string {
  const topicLower = topic.toLowerCase();
  
  const keywords: Record<string, string[]> = {
    wind_turbine: ["wind", "turbine", "blade", "renewable", "generator"],
    newton_cradle: ["newton", "cradle", "pendulum", "collision", "momentum"],
    rocket: ["rocket", "propulsion", "thrust", "space", "launch"],
    projectile: ["projectile", "trajectory", "ballistic", "throw", "cannon"],
    spring_mass: ["spring", "oscillator", "harmonic", "damping", "vibration"],
    orbital: ["orbit", "satellite", "planet", "kepler", "gravity"],
    bridge: ["bridge", "beam", "structure", "load", "span"],
    water_bottle: ["bottle", "pressure", "vessel", "container", "hoop"],
    robotic_arm: ["robot", "arm", "manipulator", "joint", "kinematics"]
  };
  
  for (const [simType, words] of Object.entries(keywords)) {
    if (words.some(word => topicLower.includes(word))) {
      return simType;
    }
  }
  
  return "custom";
}
