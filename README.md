# docker-flow-cron2

Similar to cron.dockerflow.com except you define the thing you want to run as a service, and this job forces to 0 replicas and then back up to one replica

Thus this won't work for long running uninteruptable services.

I didn't want another DSL to describe cronjobs like the dockerflow one

example usage:
```yaml
version: "3"
services:
  my-cron-service:
    labels:
      - com.df.cron2=true
      - com.df.schedule=0 * * * * *
    image: alpine
    command: echo hello world
    deploy:
      replicas: 0
      restart_policy: on-failure
```

example installation: {
```yaml
version: "3"
services:
  cron:
    image: pinked/docker-flow-cron2
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DF_UPDATE_SCHEDULE=5 * * * * *
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
      restart_policy:
        condition: any
        delay: 5s
```

At the minute I just search periodically (set by `DF_UPDATE_SCHEDULE`) for services, there is a known issue that if the service searcher runs at the same time as the job, the job might get destroyed before it runs since I crudely trash everything and rebuild the schedule tree every time. Ideally I'd use docker-flow-swarm-listener but bleh this does the job for now.

Pull requests welcome.