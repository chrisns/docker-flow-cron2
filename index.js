const Docker = require('node-docker-api').Docker
const Promise = require('bluebird')
const docker = new Docker({socketPath: '/var/run/docker.sock'})
const cron = require('node-cron')
const _ = require('lodash')
const Health = require('healthful')
const health = new Health({service: 'cron_runner', http: true, interval: 30 * 1000})

const tasks = []

const scheduleService = (service) => {
  let schedule = service.data.Spec.TaskTemplate.ContainerSpec.Labels['com.df.schedule']
  console.log(`${schedule} ${service.data.Spec.Name}`)
  tasks.push(cron.schedule(schedule, () => restartService(service)))
}

const updateCronTable = () => {
  console.log("Updating services")
  _.each(tasks, (task, i) => {
    task.destroy()
    tasks.splice(i, 1)
  })
  Promise.resolve(docker.service.list())
    .filter(service => service.data.Spec.TaskTemplate.ContainerSpec.Labels['com.df.cron2'] === 'true')
    .map(scheduleService)
}

const restartService = service =>
  Promise.resolve(setServiceReplicas(service, 0))
    .then(() => setServiceReplicas(service, 1))

const setServiceReplicas = (s, replicas) =>
  s.status()
    .then(service => {
      let spec = service.data.Spec
      spec.Mode.Replicated.Replicas = replicas
      spec.version = service.data.Version.Index
      console.log(`Setting ${service.data.Spec.Name} to ${replicas} replicas`)
      return service.update(spec)
    })

updateCronTable()
cron.schedule(process.env.DF_UPDATE_SCHEDULE, updateCronTable)

cron.schedule("* * * * * * *", () => health.ping())
