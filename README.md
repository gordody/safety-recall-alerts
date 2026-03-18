Recall Alert App

The purpose of the app is to alert users about food, pet food, cosmetics or drug related recalls and warnings from the FDA and USDA / FSIS
The continuation would be to also include recalls from the CDC, recalls from generic consumer products like fridges, tv-s, cars, etc.

The FDA / USDA alert portion of the app would look like this:

This is a client app that saves the users and their preferences in the phone preferences area: we save the user alerts in a way that gets backed up to a device-specific cloud location, similarly to apple notes, contacts, web bookmarks etc.

Notifications:
Use local notifications
iPhone:
https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app

Android:
https://developer.android.com/develop/ui/views/notifications/build-notification
https://medium.com/@munbonecci/how-to-launch-a-local-notification-in-android-afaa47eb1d1c
https://developer.android.com/develop/background-work/background-tasks/persistent

OpenFDA API-s
https://open.fda.gov/apis

Example query:
https://api.fda.gov/drug/event.json?api_key=yourAPIKeyHere&search=

OpenFDA Query parameters:
Query parameters

The API supports five query parameters. The basic building block of queries is the search parameter. Use it to “filter” requests to the API by looking in specific fields for matches. Each endpoint has its own unique fields that can be searched.

    search: What to search for, in which fields. If you don’t specify a field to search, the API will search in every field.
    sort: Sort the results of the search by the specified field in ascending or descending order by using the :asc or :desc modifier.
    count: Count the number of unique values of a certain field, for all the records that matched the search parameter. By default, the API returns the 1000 most frequent values.
    limit: Return up to this number of records that match the search parameter. Currently, the largest allowed value for the limit parameter is 1000.
    skip: Skip this number of records that match the search parameter, then return the matching records that follow. Use in combination with limit to paginate results.

Currently, the largest allowed value for the skip parameter is 25000. See Paging if you require paging through larger result sets.

OpenFDA Food API search fields spec:
client/public/openfda_food_api_fields.yaml

API Key: env:OPEN_FDA_API_KEY

Specifications:
Mobile and web app that will query the following data sources:
- FDA at https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts, 
- CDC at https://www.cdc.gov/food-safety/ and 
- Foodsafety.org recall database 

A query runs on these every day, and based on the user's location, dietary restrictions and food allergies, it will warn the user about any alerts that the user might be interested in based on location, dietary restrictions and general safety recalls.

Examples: 
- foods contaminated with pathogens
- foods containing undeclared allergens
- general safety recalls, like undisclosed choking hazards

The alerts and recalls should be applicable to the following:
- current location (or a specific address), selected state or whole US
- by default the main page should show all the latest alerts for the selected location
- alerts can be saved with alert name and the following details:
  - name, location, date range, ingredients, source (FDA Food, FDA Drugs, CDC etc.) Initially we'll only use FDA Food recalls


FDA Data details - using OpenFDA

OpenFDA API limits:
Source: https://open.fda.gov/apis/authentication/
With no API key: 240 requests per minute, per IP address. 1,000 requests per day, per IP address.
With an API key: 240 requests per minute, per key. 120,000 requests per day, per key.

OpenFDA Data
https://open.fda.gov/apis/downloads/
The data needs to be redownloaded every time it changes, due to  possible changes to the data structure

List of downloadable files:
https://api.fda.gov/download.json

OpenFDA site source code:
https://github.com/FDA/openfda/

Enforcement Report API - recommended source of alerts:
https://api.fda.gov/food/enforcement.json
https://api-datadashboard.fda.gov/v1/<endpoint>

Docs:
https://datadashboard.fda.gov/oii/api/index.htm

Endpoints:
The available endpoints (each with their own field definition pages) are:
/v1/inspections_classifications FoodSafety.gov
/v1/inspections_citations Recalls.gov
/v1/compliance_actions Fda — this is the one most relevant to recalls
/v1/import_refusals CDC


Initial implementation:
Given that the FDA DB Allows 1000 requests / day / source IP, individual devices could make 1 query every morning to check for the specified criteria. If a result is found, generate an alert.


USDA / FSIS data:

https://www.fsis.usda.gov/science-data/developer-resources/recall-api

https://www.fsis.usda.gov/fsis/api/recall/v/1

API docs:
https://www.fsis.usda.gov/sites/default/files/media_file/documents/Recall-API-documentation.pdf


Setup: pnpm 