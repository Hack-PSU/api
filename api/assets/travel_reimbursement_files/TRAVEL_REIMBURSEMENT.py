from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import StringIO, BytesIO
from PyPDF2 import PdfFileWriter, PdfFileReader
import csv
import argparse
import datetime



def createTravelReimbursment(date, description, price, payee, mailingAddress):
	#Hard code this to look for check_request_form

	fpath = "./CHECK_REQUEST_FORM.pdf"
	packet = BytesIO()
	cv=canvas.Canvas(packet, pagesize=letter)
	    
	    #create a string
	cv.setFont('Helvetica', 11)
	    #date
	cv.drawString(100, 705, date)
	    
	#expense description
	cv.drawString(30, 385, description)

	#price
	cv.drawString(500, 385, price)  

	#total
	cv.drawString(500, 315, price)

	#payee
	cv.drawString(183, 284, payee) 

	#full Mailing Address 
	cv.setFont('Helvetica', 10)
	cv.drawString(30, 194, mailingAddress)


	    #save to string
	cv.save()
	    
	    #get back to 0
	packet.seek(0)

	new_pdf = PdfFileReader(packet)
		# read your existing PDF
	existing_pdf = PdfFileReader(open(fpath, "rb"))
	output = PdfFileWriter()
		# add the "watermark" (which is the new pdf) on the existing page
	page = existing_pdf.getPage(0)
	page.mergePage(new_pdf.getPage(0))
	output.addPage(page)
		# finally, write "output" to a real file
	if args.output is None:
		outputStream = open(payee + "_Travel_Reimbursement.pdf", "wb")
	else:
		outputStream = open(args.output + payee + "_Travel_Reimbursement.pdf", "wb")
	output.write(outputStream)
	outputStream.close()


parser = argparse.ArgumentParser(description='Create travel reimbursements based on input and output filepaths.')

parser.add_argument('input', metavar="-i", type=str, help='The input file path for the csv file containing travel reimbursement data.')
parser.add_argument('-output' , type=str, help='An optional output path to dump all the pdfs.. IMPORTANT please include / at end of path; defaults to current directory if not provided')

args = parser.parse_args()

print (args.input)
print (args.output)

#C:/Users/Ryan/Desktop/HackPSU_Website/hackPSUS2018/api/travel_reimbursement_files/travel_Reimbursements.csv
with open(args.input, "rt") as f:
	mycsv = csv.reader(f, quotechar='"', delimiter=',', quoting=csv.QUOTE_ALL, skipinitialspace=True)

	now = datetime.datetime.today()

	date = now.strftime("%m/%d/%Y")

	description = "Travel Reimbursement"

	next(mycsv)
	for row in mycsv:
		price = row[1]
		payee = row[0]
		mailingAddress = row[2]
		createTravelReimbursment(date, description, price, payee, mailingAddress)




