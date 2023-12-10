import axios, { AxiosRequestConfig } from 'axios'
import { log } from 'console'
import { useEffect, useState } from 'react'

axios.interceptors.request.use((config) => {
	const accessToken = localStorage.getItem('access_token')
	if (!accessToken) {
		return config
	}
	config.headers.authorization = `Bearer ${localStorage.getItem(
		'access_token'
	)}`
	return config
})
interface pendingTask{
  config: AxiosRequestConfig,
  resolve: Function,
}

let refreshing = false
let pendingTasks: pendingTask[] = []
async function refreshToken() {
	const res = await axios.get('http://localhost:3000/user/refresh', {
		params: {
			refresh_token: localStorage.getItem('refresh_token'),
		},
	})
	localStorage.setItem('access_token', res.data.access_token || '')
	localStorage.setItem('refresh_token', res.data.refresh_token || '')
	return res
}


axios.interceptors.response.use(
	(response) => {
		return response
	},
	async (error) => {
		let { data, config,status } = error.response
    if (refreshing) {
      return new Promise((resolve) => {
        pendingTasks.push({
          config,
          resolve: resolve,
        })
      })
    }
    if (status === 401 && !config.url.includes('/user/refresh')) {
      refreshing=true
      const res = await refreshToken()
      refreshing = false
    console.log('res',res);
    
      if (res.status === 200) {
        pendingTasks.forEach(({config,resolve }) => {
          resolve(axios(config))
        })
				return axios(config)
			} else {
				// alert('登录过期，请重新登录')
				return Promise.reject(error)
			}
		} else {
			return error.response
		}
	}
)

async function login() {
	const res = await axios.post('http://localhost:3000/user/login', {
		username: 'guang',
		password: '123456',
	})
	localStorage.setItem('access_token', res.data.access_token)
	localStorage.setItem('refresh_token', res.data.refresh_token)
}

function App() {
	const [aaa, setAaa] = useState()
	const [bbb, setBbb] = useState()

  async function query() {
    //没有access_token才登录
    if (!localStorage.getItem('access_token')) {
      await login()
    }
    await [
      axios.get('http://localhost:3000/bbb'),
      axios.get('http://localhost:3000/bbb'),
      axios.get('http://localhost:3000/bbb')
    ]
		const { data: aaaData } = await axios.get('http://localhost:3000/aaa')
		const { data: bbbData } = await axios.get('http://localhost:3000/bbb')

		setAaa(aaaData)
		setBbb(bbbData)
	}
	useEffect(() => {
		query()
	}, [])

	return (
		<div style={{ color: 'red' }}>
			<p>{aaa}</p>
			<p>{bbb}</p>
		</div>
	)
}

export default App
