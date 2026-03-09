export const COASTAL_ROLES = [
  'Surfer', 'Deep Sea Diver', 'Lighthouse Keeper', 'Harbor Master',
  'Marine Biologist', 'Coast Guard', 'Coral Reef Explorer', 'Sea Captain',
  'Tide Watcher', 'Beach Cleanup Volunteer', 'Oceanographer', 'Salvage Diver',
  'Pearl Diver', 'Reef Cartographer', 'Ship Navigator', 'Sonar Operator',
  'Underwater Archaeologist', 'Marine Photographer', 'Kelp Forest Ranger',
  'Coastal Geologist', 'Dolphin Trainer', 'Whale Tracker', 'Buoy Technician',
  'Submarine Pilot', 'Tidal Engineer', 'Maritime Historian', 'Mangrove Keeper',
  'Plankton Researcher', 'Fisheries Analyst', 'Coastal Architect',
  'Tsunami Forecaster', 'Deep Sea Chef', 'Coral Restoration Biologist',
  'Shipwright', 'Marine Ecologist', 'Bioluminescence Researcher',
  'Sea Cave Explorer', 'Maritime Lawyer', 'Drift Logger', 'Coastal Meteorologist',
  'Seagrass Warden', 'Abyssal Cartographer', 'Harbor Pilot', 'Shellfish Farmer',
  'Marine Robotics Engineer', 'Coastal Surveyor', 'Ocean Current Analyst',
  'Wreck Diver', 'Deep Sea Geographer', 'Estuary Ecologist',
]

export function getRandomRole(): string {
  return COASTAL_ROLES[Math.floor(Math.random() * COASTAL_ROLES.length)]
}