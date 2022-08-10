/*
This is a schedule builder, work in progress. Steps to improvement are as follows:
 - Handle edge cases better
 - Create ui forms to input function parameters and display the schedule generated
*/
const SCHEDULE_MIN = 600;

let times = [
  {start: 800, stop: 930, isBreak: false},
  {start: 930, stop: 945, isBreak: true},
  {start: 945, stop: 1115, isBreak: false},
  {start: 1115, stop: 1215, isBreak: true},
  {start: 1215, stop: 1345, isBreak: false},
  {start: 1345, stop: 1400, isBreak: true},
  {start: 1400, stop: 1500, isBreak: false},
  {start: 1500, stop: 1515, isBreak: true},
  {start: 1515, stop: 1615, isBreak: false},
]

let breaks = [15, 60, 15, 15]

function main() {
  let schedule = TimeSchedule()
  addSchedule(schedule)
  breaks.forEach(minutes => addBreakOfDuration(minutes))

  let breakButtons = [
    [ 15, id('add-break-15') ],
    [ 30, id('add-break-30') ],
    [ 45, id('add-break-45') ],
    [ 60, id('add-break-60') ],
  ]

  breakButtons.forEach(( [duration, node] ) => {
    node.addEventListener('click', (event) => {
      event.preventDefault()
      addBreakOfDuration(duration)
      breaks.push(duration)
    })
  })

  id('clear-breaks').addEventListener('click', (event) => {
    event.preventDefault()
    breaks = []
    id('breaks-preview').innerHTML = ''
  })

  id('add-schedule').addEventListener('click', (event) => {
    event.preventDefault()
    calculateRemainingSchedule(
      id('start-time').value,
      id('break-minutes-taken').value,
      id('current-time').value,
      breaks
    )
  })

  id('start-time').addEventListener('change', (event) => {
    let currentTime = id('current-time')
    if (Number(currentTime.value) < Number(event.target.value)) {
      currentTime.value = event.target.value
    }
  })

  id('current-time').addEventListener('change', (event) => {
    let startTime = id('start-time')
    if (Number(startTime.value) > Number(event.target.value)) {
      startTime.value = event.target.value
    }
  })
}

function addBreakOfDuration(minutes) {
  let breaksSection = id('breaks-preview')
  let block = Block(minutes, false)
  breaksSection.appendChild(block)
}

function addSchedule(schedule) {
  let container = qs('.schedules')
  container.appendChild(schedule)
}

// It is assumed that the system is being used at the beginning of a work period.
// Remaining breaks is an array of breaks I want to take before I finish work.
// e.g. the default should be at the beginning of the day [15, 60, 15, 15]
// If a schedule cannot be made that has no work periods longer than 1.5 hrs and also only takes the breaks allotted, then this function will alert the difference between remaining work and scheduled work.
function calculateRemainingSchedule(startTime, minutesBreakTaken, currentTime, remainingBreaks) {

  let minutesWorkDone = parseTime(currentTime) - parseTime(startTime) - minutesBreakTaken
  let durations = []
  if (startTime !== SCHEDULE_MIN) {
    durations.push(
      {minutes: parseTime(startTime), isBreak: true}
    )
  }
  if (startTime !== currentTime) {
    durations = durations.concat([
      {minutes: minutesWorkDone, isBreak: false},
      {minutes: minutesBreakTaken, isBreak: true},
    ])
  }

  const NUM_WORK_BLOCKS = 1 + remainingBreaks.length
  let remainingMinutesOfWork = 6.5 * 60 - minutesWorkDone
  let avgMinutesPerWorkBlock = remainingMinutesOfWork / NUM_WORK_BLOCKS
  let fifteenBlocks = Math.trunc(avgMinutesPerWorkBlock / 15)
  // Set each work period to avg fifteen blocks - 1, add fifteen blocks in a triangular fashion while keeping each work period below 1.5 hours until work quota is met
  let workDurationsInMinutes = Array(NUM_WORK_BLOCKS).fill((fifteenBlocks - 1) * 15)
  let sumOfWorkAccounted = workDurationsInMinutes.reduce((a, b) => a + b)
  // While all work blocks are less than 1.5 hrs
  outerLoop:
  while (sumOfWorkAccounted / NUM_WORK_BLOCKS < 90) {
    for (let i = NUM_WORK_BLOCKS; i >= 0; i--) {
      for (let j = 0; j < i; j++) {
        if (sumOfWorkAccounted >= remainingMinutesOfWork) {
          break outerLoop;
        }
        if (workDurationsInMinutes[j] <= 75) {
          workDurationsInMinutes[j] += 15
          sumOfWorkAccounted += 15
        }
      }
    }
  }
  if (sumOfWorkAccounted !== remainingMinutesOfWork) {
    window.alert(`Malformed schedule! Remaining work = ${remainingMinutesOfWork}, work accounted in schedule = ${sumOfWorkAccounted}`)
  }

  durations.push({minutes: workDurationsInMinutes[0], isBreak: false})

  for (let i = 1; i < workDurationsInMinutes.length; i++) {
    durations.push({minutes: remainingBreaks[i - 1], isBreak: true})
    durations.push({minutes: workDurationsInMinutes[i], isBreak: false})
  }
  addSchedule(TimeScheduleFromDurations(durations))
  return durations
}

function TimeScheduleFromDurations(durations) {
  let blocksContainer = create('div')
  blocksContainer.classList.add('blocks-container')
  durations.forEach((duration) => {
    blocksContainer.appendChild(Block(duration.minutes, duration.isBreak))
  })
  return blocksContainer
}

function TimeSchedule() {
  let durations = []
  if (times[0].start > SCHEDULE_MIN) {
    durations.push({ minutes: parseTime(times[0].start) - parseTime(SCHEDULE_MIN), isBreak: true })
  }
  times.forEach((time) => {
    durations.push({ minutes: parseTime(time.stop) - parseTime(time.start), isBreak: time.isBreak })
  })
  return TimeScheduleFromDurations(durations)
}

function Block(duration, isBreak) {
  // Objective HTML:
  // <div style='height: calc(${duration}*var(--minute)); background-color: ${color}'></div>
  let block = create('div')
  let color = isBreak ? 'white' : 'blue'
  block.style = `height: calc(${duration}*var(--minute)); background-color: ${color};`
  block.classList.add('time-block')
  return block
}

// Returns number of minutes since SCHEDULE_MIN when given hh:mm format time. Note: 24-hour clock is assumed.
function parseTime(time) {
  let minHour = Math.trunc(SCHEDULE_MIN / 100)
  let minMinutes = SCHEDULE_MIN - minHour * 100
  let hour = Math.trunc(time / 100) - minHour
  let minutes = time - (hour * 100 + 600) - minMinutes
  return hour * 60 + minutes
}

// Changes a number of minutes into a hh:mm format (it is still a duration): e.g. 90min => 130
function minutesToHHMMDuration(durationInMinutes) {
  let hours = Math.trunc(durationInMinutes / 60)
  let minutes = durationInMinutes - 60 * hours
  return 100 * hours + minutes
}

function id(elementID) {return document.getElementById(elementID)}
function qs(selector) {return document.querySelector(selector)}
function qsa(selector) {return document.querySelectorAll(selector)}
function create(element) {return document.createElement(element)}

window.addEventListener('load', main)