# nurburg-libs

> nurburg-libs@0.4.1 gen-fault-tokens /home/anunay/nurburg.dev/nurburg-libs/ts
> tsx src/gen-fault-tokens.ts


# fetch / pre_error (always)
  JSON:  {"fetch":[{"type":"pre_error","errorProbability":1}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InByZV9lcnJvciIsImVycm9yUHJvYmFiaWxpdHkiOjF9XX0=

# fetch / pre_error (2 times)
  JSON:  {"fetch":[{"type":"pre_error","errorProbability":1,"errorCount":2}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InByZV9lcnJvciIsImVycm9yUHJvYmFiaWxpdHkiOjEsImVycm9yQ291bnQiOjJ9XX0=

# fetch / pre_error (50 % chance)
  JSON:  {"fetch":[{"type":"pre_error","errorProbability":0.5}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InByZV9lcnJvciIsImVycm9yUHJvYmFiaWxpdHkiOjAuNX1dfQ==

# fetch / post_error (always)
  JSON:  {"fetch":[{"type":"post_error","errorProbability":1}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InBvc3RfZXJyb3IiLCJlcnJvclByb2JhYmlsaXR5IjoxfV19

# fetch / post_error (2 times)
  JSON:  {"fetch":[{"type":"post_error","errorProbability":1,"errorCount":2}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InBvc3RfZXJyb3IiLCJlcnJvclByb2JhYmlsaXR5IjoxLCJlcnJvckNvdW50IjoyfV19

# fetch / slow_request (300 ms)
  JSON:  {"fetch":[{"type":"slow_request","delayMs":300}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InNsb3dfcmVxdWVzdCIsImRlbGF5TXMiOjMwMH1dfQ==

# fetch / slow_request (2 s)
  JSON:  {"fetch":[{"type":"slow_request","delayMs":2000}]}
  TOKEN: eyJmZXRjaCI6W3sidHlwZSI6InNsb3dfcmVxdWVzdCIsImRlbGF5TXMiOjIwMDB9XX0=

# postgresql / errored_commit (always)
  JSON:  {"postgresql":[{"type":"errored_commit","errorProbability":1}]}
  TOKEN: eyJwb3N0Z3Jlc3FsIjpbeyJ0eXBlIjoiZXJyb3JlZF9jb21taXQiLCJlcnJvclByb2JhYmlsaXR5IjoxfV19

# postgresql / errored_commit (2 times)
  JSON:  {"postgresql":[{"type":"errored_commit","errorProbability":1,"errorCount":2}]}
  TOKEN: eyJwb3N0Z3Jlc3FsIjpbeyJ0eXBlIjoiZXJyb3JlZF9jb21taXQiLCJlcnJvclByb2JhYmlsaXR5IjoxLCJlcnJvckNvdW50IjoyfV19

# postgresql / errored_commit (50 % chance)
  JSON:  {"postgresql":[{"type":"errored_commit","errorProbability":0.5}]}
  TOKEN: eyJwb3N0Z3Jlc3FsIjpbeyJ0eXBlIjoiZXJyb3JlZF9jb21taXQiLCJlcnJvclByb2JhYmlsaXR5IjowLjV9XX0=

# postgresql / slow_query (300 ms)
  JSON:  {"postgresql":[{"type":"slow_query","delayMs":300}]}
  TOKEN: eyJwb3N0Z3Jlc3FsIjpbeyJ0eXBlIjoic2xvd19xdWVyeSIsImRlbGF5TXMiOjMwMH1dfQ==

# postgresql / slow_query (2 s)
  JSON:  {"postgresql":[{"type":"slow_query","delayMs":2000}]}
  TOKEN: eyJwb3N0Z3Jlc3FsIjpbeyJ0eXBlIjoic2xvd19xdWVyeSIsImRlbGF5TXMiOjIwMDB9XX0=

# mysql / errored_commit (always)
  JSON:  {"mysql":[{"type":"errored_commit","errorProbability":1}]}
  TOKEN: eyJteXNxbCI6W3sidHlwZSI6ImVycm9yZWRfY29tbWl0IiwiZXJyb3JQcm9iYWJpbGl0eSI6MX1dfQ==

# mysql / errored_commit (2 times)
  JSON:  {"mysql":[{"type":"errored_commit","errorProbability":1,"errorCount":2}]}
  TOKEN: eyJteXNxbCI6W3sidHlwZSI6ImVycm9yZWRfY29tbWl0IiwiZXJyb3JQcm9iYWJpbGl0eSI6MSwiZXJyb3JDb3VudCI6Mn1dfQ==

# mysql / errored_commit (50 % chance)
  JSON:  {"mysql":[{"type":"errored_commit","errorProbability":0.5}]}
  TOKEN: eyJteXNxbCI6W3sidHlwZSI6ImVycm9yZWRfY29tbWl0IiwiZXJyb3JQcm9iYWJpbGl0eSI6MC41fV19

# mysql / slow_query (300 ms)
  JSON:  {"mysql":[{"type":"slow_query","delayMs":300}]}
  TOKEN: eyJteXNxbCI6W3sidHlwZSI6InNsb3dfcXVlcnkiLCJkZWxheU1zIjozMDB9XX0=

# mysql / slow_query (2 s)
  JSON:  {"mysql":[{"type":"slow_query","delayMs":2000}]}
  TOKEN: eyJteXNxbCI6W3sidHlwZSI6InNsb3dfcXVlcnkiLCJkZWxheU1zIjoyMDAwfV19

# kafka / slow_producer (300 ms)
  JSON:  {"kafka":[{"type":"slow_producer","delayMs":300}]}
  TOKEN: eyJrYWZrYSI6W3sidHlwZSI6InNsb3dfcHJvZHVjZXIiLCJkZWxheU1zIjozMDB9XX0=

# kafka / slow_producer (2 s)
  JSON:  {"kafka":[{"type":"slow_producer","delayMs":2000}]}
  TOKEN: eyJrYWZrYSI6W3sidHlwZSI6InNsb3dfcHJvZHVjZXIiLCJkZWxheU1zIjoyMDAwfV19

# kafka / flaky_consumer (always)
  JSON:  {"kafka":[{"type":"flaky_consumer","errorProbability":1}]}
  TOKEN: eyJrYWZrYSI6W3sidHlwZSI6ImZsYWt5X2NvbnN1bWVyIiwiZXJyb3JQcm9iYWJpbGl0eSI6MX1dfQ==

# kafka / flaky_consumer (2 times)
  JSON:  {"kafka":[{"type":"flaky_consumer","errorProbability":1,"errorCount":2}]}
  TOKEN: eyJrYWZrYSI6W3sidHlwZSI6ImZsYWt5X2NvbnN1bWVyIiwiZXJyb3JQcm9iYWJpbGl0eSI6MSwiZXJyb3JDb3VudCI6Mn1dfQ==

# kafka / flaky_consumer (50 % chance)
  JSON:  {"kafka":[{"type":"flaky_consumer","errorProbability":0.5}]}
  TOKEN: eyJrYWZrYSI6W3sidHlwZSI6ImZsYWt5X2NvbnN1bWVyIiwiZXJyb3JQcm9iYWJpbGl0eSI6MC41fV19
