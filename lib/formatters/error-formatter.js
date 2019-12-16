/*!
 * Copyright 2019 Jorge Proaño.
 */
'use strict'

const Constants = require('../constants')
const { modulePath, shortPath, isError } = require('../utils')
const { format } = require('util')
const Stack = require('../utils/Stack')

/**
 *
 *
 * @param {Pretty.LogRecord} record
 * @param _config
 * @param chalk
 * @returns {string[]}
 */
function render(record, _config, chalk) {
  if (!isError(record)) return []

  const bold = chalk.red.bold
  const dimmed = chalk.dim
  const grey = chalk.blackBright

  const output = []

  const name = record.stack.split('\n')[0]

  if (name !== null && name !== undefined) {
    output.push(bold(Constants.ARROW + Constants.SPACE_CHAR + name))
  }
  if (record.code !== null && record.code !== undefined) {
    output.push(padRed('code') + grey(record.code))
  }

  if (record.signal !== null && record.signal !== undefined) {
    output.push(padRed('signal') + grey(record.signal))
  }

  const stacks = record.stack.split('Caused by: ')

  const stack = Stack(stacks.shift())

  if (stack.length > 0) {
    output.push(padRed('stack') + chalk.dim(`[${stack.length - 1} Frames]`))
    const onlyApps = stack.filter(frame => frame.kind === 'Application')
    if (onlyApps.length === 0) addFrames(stack)
    else addFrames(onlyApps)
  }

  stacks.forEach(cause => {
    const reason = getReason(cause)
    const stackFrames = Stack(cause)

    if (stackFrames.length > 0) {
      output.push(
        padRed('Caused by') +
          chalk.red(reason) +
          chalk.dim(` [${stackFrames.length - 1} Frames]`)
      )

      const onlyApps = stackFrames.filter(frame => frame.kind === 'Application')
      if (onlyApps.length === 0) addFrames(stackFrames)
      else addFrames(onlyApps)
    }
  })

  return output.map(v => Constants.PADDING + v)

  function addFrames(stack) {
    const formatStack = prettyStack(stack)

    formatStack.forEach(function(frame) {
      output.push(
        Constants.PADDING +
          dimmed(Constants.SPACE_CHAR) +
          grey(Constants.DOT) +
          Constants.SPACE_CHAR +
          frame
      )
    })
  }

  function padRed(head) {
    return chalk.red(Constants.PADDING + head + ':' + Constants.SPACE_CHAR)
  }

  function getReason(cause) {
    const first = cause
      .split('\n')
      .shift()
      .split(';')
      .shift()

    return first.replace('Caused by: ', '') || ''
  }

  function prettyStack(stack) {
    const frames = stack || []
    const lines = []
    frames.forEach(function(frame) {
      let color = 'dim'
      switch (frame.kind) {
        case 'Library':
          color = 'reset'
          break
        case 'Application':
          color = 'yellow'
          break
      }

      let filepath = frame.path
      if (frame.kind === 'Application') filepath = shortPath(frame.path)
      if (frame.kind === 'Library') filepath = modulePath(frame.path)

      let formatFrame = format(
        '%s:%s:%s - %s',
        filepath,
        frame.line,
        frame.cn,
        frame.fn
      )

      lines.push(chalk[color](formatFrame))
    })

    return lines
  }
}

module.exports = render
