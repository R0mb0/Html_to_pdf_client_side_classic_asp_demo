<%
' save_pdf.en.asp
' Receives:
'   - fileName (name of the .pdf file)
'   - pdfData (PDF content as "raw" base64)
' Saves the file to disk and returns the public URL of the PDF.

Option Explicit

' ===========================================================
' CONFIGURATION
' ===========================================================
Const PDF_SAVE_PATH = "D:\inetpub\wwwroot\YourSite\pdf\" ' <-- ADAPT TO YOUR ENVIRONMENT
Const PDF_URL_BASE  = "/pdf/"                             ' <-- ADAPT TO YOUR SITE

' ===========================================================
' Function to decode base64 into binary (VBScript)
' ===========================================================
Function Base64ToBinary(base64String)
    Dim xmlObj
    Set xmlObj = CreateObject("MSXML2.DOMDocument.3.0")
    ' MSXML 3.0 directly supports base64 decoding
    Dim node
    Set node = xmlObj.createElement("b64")
    node.dataType = "bin.base64"
    node.text = base64String
    Base64ToBinary = node.nodeTypedValue
    Set node = Nothing
    Set xmlObj = Nothing
End Function

' ===========================================================
' Main logic
' ===========================================================
Dim fileName, pdfDataBase64

fileName = Request.Form("fileName")
pdfDataBase64 = Request.Form("pdfData")

If fileName = "" Or pdfDataBase64 = "" Then
    Response.Status = "400 Bad Request"
    Response.Write("Missing parameters.")
    Response.End
End If

' Basic security: prevent path traversal
fileName = Replace(fileName, "..", "")
fileName = Replace(fileName, "/", "")
fileName = Replace(fileName, "\", "")

' If .pdf extension is missing, append it
If LCase(Right(fileName, 4)) <> ".pdf" Then
    fileName = fileName & ".pdf"
End If

Dim binaryData
binaryData = Base64ToBinary(pdfDataBase64)

' Write file
Dim fso, fileStream, fullPath
fullPath = PDF_SAVE_PATH & fileName

On Error Resume Next

Set fso = CreateObject("Scripting.FileSystemObject")

' Make sure the folder exists; otherwise, fail
' (no recursive creation here)
If Not fso.FolderExists(PDF_SAVE_PATH) Then
    ' You may decide to try creating the folder:
    ' fso.CreateFolder PDF_SAVE_PATH
    ' Or simply fail:
    Response.Status = "500 Internal Server Error"
    Response.Write("Destination folder does not exist.")
    Response.End
End If

' Open an ADODB stream to write binary data
Dim adoStream
Set adoStream = CreateObject("ADODB.Stream")
adoStream.Type = 1 ' binary
adoStream.Open
adoStream.Write binaryData
adoStream.SaveToFile fullPath, 2 ' adSaveCreateOverWrite = 2
adoStream.Close
Set adoStream = Nothing

If Err.Number <> 0 Then
    Dim errMsg
    errMsg = "Error while saving file: " & Err.Description
    Err.Clear
    Set fso = Nothing
    Response.Status = "500 Internal Server Error"
    Response.Write(errMsg)
    Response.End
End If

Set fso = Nothing

' Build public URL
Dim fileUrl
fileUrl = PDF_URL_BASE & fileName

' Response to the client (plain-text URL)
Response.ContentType = "text/plain"
Response.Write(fileUrl)
Response.End
%>