jest.mock('../../models/visit')

jest.mock('../../insert_event')

// make sure all Date objects use a static date
mockStaticDate()

jest.mock('../../db')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this

// override requireCurrentUser to provide our own
let mockCurrentUser
let mockSaveSessionSuccess = true
jest.mock('../../express_current_user', () => (req, res, next) => {
	currentReq = req
	req.requireCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	req.saveSessionPromise = () => {
		if (mockSaveSessionSuccess) return Promise.resolve()
		return Promise.reject()
	}
	next()
})

let currentReq
// ovveride requireCurrentDocument to provide our own
let mockCurrentDocument
jest.mock('../../express_current_document', () => (req, res, next) => {
	req.requireCurrentDocument = () => {
		if (!mockCurrentDocument) return Promise.reject()
		req.currentDocument = mockCurrentDocument
		return Promise.resolve(mockCurrentDocument)
	}
	next()
})

// ovveride requireCurrentDocument to provide our own
let mockLtiLaunch
jest.mock('../../express_lti_launch', () => ({
	assignment: (req, res, next) => {
		req.lti = { body: mockLtiLaunch }
		req.oboLti = {
			launchId: 'mock-launch-id',
			body: mockLtiLaunch
		}
		next()
	}
}))

// setup express server
const db = oboRequire('db')
const request = require('supertest')
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.set('views', __dirname + '../../../views/')
app.use(oboRequire('express_current_user'))
app.use(oboRequire('express_current_document'))
app.use('/', oboRequire('express_response_decorator'))
app.use('/', oboRequire('routes/viewer'))

describe('viewer route', () => {
	const insertEvent = oboRequire('insert_event')
	const Visit = oboRequire('models/visit')
	const mockYell = jest.fn().mockResolvedValue({
		draftId: 555,
		contentId: 12
	})

	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		currentReq = null
		mockCurrentUser = { id: 4 }
		insertEvent.mockReset()
	})
	afterEach(() => {})

	test('launch visit requires current user in form requests', () => {
		expect.assertions(3)
		mockCurrentUser = null
		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/x-www-form-urlencoded')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toBe('Not Authorized')
			})
	})

	test('launch visit requires current user in json requests', () => {
		expect.assertions(5)
		mockCurrentUser = null
		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/json')
			.then(response => {
				expect(response.header['content-type']).toContain('application/json')
				expect(response.statusCode).toBe(401)
				expect(response.body).toHaveProperty('status', 'error')
				expect(response.body).toHaveProperty('value')
				expect(response.body.value).toHaveProperty('type', 'notAuthorized')
			})
	})

	test('launch visit requires a currentDocument', () => {
		expect.assertions(3)
		mockCurrentDocument = null

		return request(app)
			.post(`/${validUUID()}/`)
			.type('application/x-www-form-urlencoded')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(422)
				expect(response.text).toBe('Bad Input: Session DraftDocument Required, got undefined')
			})
	})

	test('launch visit redirects', () => {
		expect.assertions(3)

		Visit.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		// mockCurrentUser = {id: 44}
		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(response.text).toBe(
					'Found. Redirecting to /view/' + validUUID() + '/visit/mocked-visit-id'
				)
			})
	})

	test('launch visit inserts event `visit:create`', () => {
		expect.assertions(4)
		Visit.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/plain')
				expect(response.statusCode).toBe(302)
				expect(insertEvent).toHaveBeenCalledTimes(1)
				expect(insertEvent.mock.calls[0]).toMatchSnapshot()
			})
	})

	test('launch visit doesnt redirect with session errors', () => {
		expect.assertions(3)

		mockSaveSessionSuccess = false

		Visit.createVisit.mockResolvedValueOnce({
			visitId: 'mocked-visit-id',
			deactivatedVisitId: 'mocked-deactivated-visit-id'
		})

		mockCurrentDocument = { draftId: validUUID() }
		mockLtiLaunch = { resource_link_id: 3 }

		return request(app)
			.post(`/${validUUID()}/`)
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(404)
				expect(insertEvent).toHaveBeenCalledTimes(1)
			})
	})

	test('view visit requires a current user', () => {
		expect.assertions(3)
		mockCurrentUser = null

		return request(app)
			.get('/' + validUUID() + '/visit/3')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toBe('Not Authorized')
			})
	})

	test('view visit requires a current document', () => {
		expect.assertions(3)

		mockCurrentDocument = null
		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(422)
				expect(response.text).toBe('Bad Input: Session DraftDocument Required, got undefined')
			})
	})

	test('view visit requires visitId be a UUID', () => {
		expect.assertions(3)
		mockCurrentDocument = { draftId: validUUID() }

		return request(app)
			.get('/' + validUUID() + '/visit/3')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(422)
				expect(response.text).toBe('Bad Input: visitId must be a valid UUID, got 3')
			})
	})

	test('view visit inserts viewer:open event', () => {
		expect.assertions(4)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockResolvedValueOnce()
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(insertEvent).toHaveBeenCalledTimes(1)
				expect(insertEvent.mock.calls[0]).toMatchSnapshot()
			})
	})

	test('view visit renders viewer', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockResolvedValueOnce(),
			root: {
				node: {
					content: {
						title: 'my-title'
					}
				}
			}
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('Obojobo Next Document Viewer')
			})
	})

	test('view 500s when yell rejects and displays error', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockRejectedValueOnce('some-error')
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('some-error')
			})
	})

	test('view 500s when yell rejects and displays default error', () => {
		expect.assertions(3)
		mockCurrentDocument = {
			draftId: validUUID(),
			yell: jest.fn().mockRejectedValueOnce()
		}

		return request(app)
			.get('/' + validUUID() + '/visit/' + validUUID())
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(500)
				expect(response.text).toContain('Server Error')
			})
	})
})
