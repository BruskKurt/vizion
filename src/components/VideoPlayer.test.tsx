import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { VideoPlayer } from './VideoPlayer'

describe('VideoPlayer', () => {
  it('rend un élément <video>', () => {
    const { container } = render(<VideoPlayer src="http://h/s.m3u8" />)
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
  })
})
