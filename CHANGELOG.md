# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-08

User stories: code-corhuila/barber-saas-docs#4, code-corhuila/barber-saas-docs#8, code-corhuila/barber-saas-docs#59

### Added

- federation: build the remote with native federation exposing ./mount
- app: copy the types of the contract with the shell
- federation: mount the app in the element the shell provides
- appointment: add the types of appointment-service.yaml and the catalog it needs
- appointment: call appointment-api, barbershop-api and schedule-api only through the shell client
- appointment: add the day chips, the actions per status and the booking guard
- appointment: show statuses in spanish and prices in whole pesos
- navigation: add the routes of the domain and the booking link of barbershop-app
- ui: show loading, error with retry, empty and data in every view
- appointment: say appointment-api's business errors in spanish
- appointment: name services and barbers from the catalog without failing the list
- ui: list a client's appointments and cancel one after asking
- ui: book a service with a barber on a free slot with one idempotency key per intent
- navigation: open the client screens and the booking link of barbershop-app
- ui: show a day's agenda with only the transitions each status allows
- ui: show a barber's completed appointments and what they generated
- navigation: open the barber agenda and history and the owner agenda by role
- deploy: serve the built remote for development and review
- app: copy the shell's enterBarbershop and barbershopId into the contract
- appointment: read the barber name barbershop-api keeps
- appointment: read the booking's catalog from the barbershop's public pages
- appointment: enter the barbershop before any request scoped to it and say why it failed
- ui: book after entering the barbershop, with retry or back to the catalog
- navigation: book in the link's barbershop or the one the session entered
- appointment: name each client appointment's barbershop, barber and service
- appointment: compute a barber's metrics of a day, week or month
- ui: show a barber's metrics, reached from their agenda

### Fixed

- ui: leave a margin between the agenda's day chips and the first card
- ui: drop the empty space at the bottom of a card without actions

### Changed

- ui: keep the dark and gold look of the prototype under its own prefix

### Documentation

- readme: explain the appointment app, how to run it with the shell and how to test it
- readme: explain the bound booking and drop oq-07 and oq-08
- readme: point the header to Barber Saas and barber-saas-docs
- readme: explain how a client's list names its barbershops
- readme: add the barber's metrics screen

### Tests

- ci: run the tests, check the types and build the remote on every pull request
- appointment: specify the api calls, the rules of the screens, the labels and the routes
- ui: specify the error message shown, the idempotency keys and the business messages
- appointment: specify entering the barbershop first, its failures, its public catalog and barber names

### Maintenance

- app: ignore dependencies, build output and env files
- github: add the pull request template
- github: track the story environment on the board
- build: add ionic react 8, react 19 and typescript with the shell's versions
- use the new repository name barber-saas-infra-postgres

[2.0.0]: https://github.com/code-corhuila/barber-saas-appointment-app/releases/tag/v2.0.0
