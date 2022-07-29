/*
This is a quick and dirty schedule builder. Before any modifications are made to this program, one
should refactor it considerably. Namely, it would be better to have a TimeScheduleFromDurations
function that takes in an array of durations with booleans for if they denote a break or not. Then,
calculateRemainingSchedule would be greatly simplified.
*/
const SCHEDULE_MIN = 600;

var times = [ 
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

function main() {
  let container = qs('.container')
  container.appendChild(TimeSchedule())

}

// It is assumed that the system is being used at the beginning of a work period.
// Remaining breaks is an array of breaks I want to take before I finish work.
// e.g. the default should be at the beginning of the day [15, 60, 15]
// If a schedule cannot be made that has no work periods longer than 1.5 hrs and also only takes the breaks allotted, then this function will alert the difference between remaining work and scheduled work.
function calculateRemainingSchedule(startTime, breakTimeTaken, currentTime, remainingBreaks) {

  let workTimeDone = parseTime(currentTime) - parseTime(startTime) - breakTimeTaken
  times = [
    {start: startTime, stop: SCHEDULE_MIN + unparseDuration(parseTime(startTime) + workTimeDone), isBreak: false},
    {
      start: startTime + unparseDuration(workTimeDone),
      stop: currentTime,
      isBreak: true
    }
  ]

  const NUM_WORK_BLOCKS = 1 + remainingBreaks.length
  let remainingWorkTime = 6.5 * 60 - workTimeDone
  let avgWorkTime = remainingWorkTime / NUM_WORK_BLOCKS
  let fifteenBlocks = Math.trunc(avgWorkTime / 15)
  // Set each work period to avg fifteen blocks - 1, add fifteen blocks in a triangular fashion while keeping each work period below 1.5 hours until work quota is met
  let workTimes = Array(NUM_WORK_BLOCKS).fill(fifteenBlocks - 1)
  let sumOfWorkAccounted = workTimes.reduce((a, b) => a + b) * 15
  // 
  for (let i = 0; i < workTimes.length; i++) {
    for (let j = 0; j < i; j++) {
      if (sumOfWorkAccounted >= remainingWorkTime) {
        break;
      }
      if (workTimes[j] * 15 <= 75) {
        workTimes[j] += 1
        sumOfWorkAccounted += 15
      }
    }
  }
  if (sumOfWorkAccounted != remainingWorkTime) {
    window.alert(`remaining work = ${remainingWorkTime}, work accounted in schedule = ${sumOfWorkAccounted}`)
  }
  let startOfRemainingSched = currentTime
  let workDuration = workTimes[0] * 15
  workTimes = workTimes.slice(1)
  times.push({
    start: startOfRemainingSched,
    stop: startOfRemainingSched + unparseDuration(workDuration),
    isBreak: false
  })
  while (workTimes.length > 0) {
    let breakDuration = remainingBreaks[0]
    remainingBreaks = remainingBreaks.slice(1)
    times.push({
      start: times[times.length - 1].stop,
      stop: SCHEDULE_MIN + unparseDuration(parseTime(times[times.length - 1].stop) + breakDuration),
      isBreak: true
    })

    workDuration = workTimes[0] * 15
    workTimes = workTimes.slice(1)
    times.push({
      start: times[times.length - 1].stop,
      stop: SCHEDULE_MIN + unparseDuration(parseTime(times[times.length - 1].stop) + workDuration),
      isBreak: false
    })
  }
  console.log(times)
}

function TimeSchedule() {
  let blocksContainer = create('div')
  blocksContainer.classList.add('blocks-container')
  if (times[0].start > SCHEDULE_MIN) {
    blocksContainer.appendChild(Block(parseTime(times[0].start) - parseTime(SCHEDULE_MIN), true))
  }
  times.forEach((time) => {
    blocksContainer.appendChild(Block(parseTime(time.stop) - parseTime(time.start), time.isBreak))
  })
  return blocksContainer
}

function Block(duration, isBreak) {
  // <div style='height: calc(${duration}*var(--minute)); background-color: ${color}'></div>
  let block = create('div')
  let color = isBreak ? 'white' : 'blue'
  block.style = `height: calc(${duration}*var(--minute)); background-color: ${color};`
  return block
}

// Returns minutes since SCHEDULE_MIN when given hh:mm format time. Note: 24 hour clock is assumed.
function parseTime(time) {
  let minHour = Math.trunc(SCHEDULE_MIN / 100)
  let minMinutes = SCHEDULE_MIN - minHour * 100
  let hour = Math.trunc(time / 100) - minHour
  let minutes = time - (hour * 100 + 600) - minMinutes
  return hour * 60 + minutes
}

// Changes a number of minutes into a hh:mm format: e.g. 90min => 130
function unparseDuration(durationInMinutes) {
  hours = Math.trunc(durationInMinutes / 60)
  minutes = durationInMinutes - 60 * hours
  return 100*hours + minutes
}

function qs(selector) {return document.querySelector(selector)}
function qsa(selector) {return document.querySelectorAll(selector)}
function create(element) {return document.createElement(element)}

window.addEventListener('load', main)