package com.yrtech.excel;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Environment;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.io.File;
import java.io.IOException;

import jxl.CellType;
import jxl.Sheet;
import jxl.Workbook;
import jxl.read.biff.BiffException;
import jxl.write.Label;
import jxl.write.WritableCell;
import jxl.write.WritableSheet;
import jxl.write.WritableWorkbook;
import jxl.write.WriteException;
import jxl.write.biff.RowsExceededException;

import java.io.FileInputStream;  
import java.io.FileOutputStream;  
import java.io.InputStream;  
  
import org.apache.http.util.EncodingUtils;  
  
import android.app.Activity;
/**
* This class echoes a string called from JavaScript.
*/
public class Excel extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("echo")) {
		    String fileName = args.getJSONArray(0).getJSONObject(0).getString("ShopName")+"_"+(new SimpleDateFormat("yyyyMMddhhmmss")).format(new Date())+".xls";
			this.writeExcel1(this.cordova.getActivity().getApplicationContext(), callbackContext, "一汽丰田" +"/" + fileName, args.getJSONArray(0), args.getJSONArray(1));
			callbackContext.success(fileName);
	        return true;
        }
        return false;
    }
    // 写在/mnt/sdcard/目录下面的文件  
    public void writeFileSdcard(String fileName, String message) {  
  
        try {  
        	File file = null;
            // FileOutputStream fout = openFileOutput(fileName, MODE_PRIVATE);  
        	file = new File(fileName);
            if (!file.exists()) {
                file.createNewFile();
            }
  
            FileOutputStream fout = new FileOutputStream(fileName);  
  
            byte[] bytes = message.getBytes();  
  
            fout.write(bytes);  
  
            fout.close();  
  
        }  
  
        catch (Exception e) {  
  
            e.printStackTrace();  
  
        }  
  
    }  
    private void writeExcel1(Context cxt, CallbackContext callbackContext, String strOutFileName, JSONArray answerList1, JSONArray answerList2) throws JSONException
    {
        try {
            Workbook wb = Workbook.getWorkbook(cxt.getAssets().open("template.xls"));
            WritableWorkbook workbook  =  Workbook.createWorkbook(new File(Environment.getExternalStorageDirectory(), strOutFileName), wb);

            WritableSheet sheet1 = workbook.getSheet(0);
            for(int i=0;i<answerList1.length();i++){
			    int row = i+1;
				JSONObject answer = answerList1.getJSONObject(i);
                this.writeCell(sheet1,0,row,i+1+"");
                this.writeCell(sheet1,1,row,answer.getString("ShopCode"));
                this.writeCell(sheet1,2,row,answer.getString("ShopName"));
                this.writeCell(sheet1,3,row,answer.getString("ModelName"));
                this.writeCell(sheet1,4,row,answer.getString("VinCode8"));
                this.writeCell(sheet1,5,row,answer.getString("VinCode"));
		this.writeCell(sheet1,6,row,"O");
		this.writeCell(sheet1,7,row,"O");
		this.writeCell(sheet1,8,row,"O");
		this.writeCell(sheet1,9,row,"O");
		this.writeCell(sheet1,10,row,"O");
		this.writeCell(sheet1,11,row,"O");
		this.writeCell(sheet1,12,row,"O");
		this.writeCell(sheet1,13,row,"O");
		String Remark = answer.getString("Remark");
            if(Remark.contains("缺失发票记账联"))
		{
		this.writeCell(sheet1,6,row,"Y");
		}
	if(Remark.contains("缺失用户确认表原件"))
		{
		this.writeCell(sheet1,7,row,"Y");
		}
if(Remark.contains("缺失身份证或行驶证"))
		{
		this.writeCell(sheet1,8,row,"Y");
		}
if(Remark.contains("四证信息（姓名、身份证号、VIN号）不一致"))
		{
		this.writeCell(sheet1,9,row,"Y");
		}
if(Remark.contains("用户确认表无签字"))
		{
		this.writeCell(sheet1,10,row,"Y");
		}
if(Remark.contains("未提供打款凭证或现金收据或销售合同或销售订单（4选1）"))
		{
		this.writeCell(sheet1,11,row,"Y");
		}
if(Remark.contains("销售合同或销售订单或现金收据或打款凭证（4选1）与用户确认表、发票姓名不一致"))
		{
		this.writeCell(sheet1,12,row,"Y");
		}
if(Remark.contains("用户确认表、发票联与销售合同或销售订单或现金收据或打款凭证（4选1）三者签字笔体不一致"))
		{
		this.writeCell(sheet1,13,row,"Y");
		}

		}
            workbook.write();
            workbook.close();
        } catch (IOException e) {
        	writeFileSdcard("一汽丰田" +"/" + "12.txt",e.getMessage());
			callbackContext.error(e.getMessage());
            e.printStackTrace();
        } catch (RowsExceededException e) {
        	writeFileSdcard("一汽丰田" +"/" + "12.txt",e.getMessage());
			callbackContext.error(e.getMessage());
            e.printStackTrace();
        } catch (WriteException e) {
        	writeFileSdcard("一汽丰田" +"/" + "12.txt",e.getMessage());
			callbackContext.error(e.getMessage());
            e.printStackTrace();
        } catch (BiffException e) {
        	writeFileSdcard("Download" +"/" + "12.txt",e.getMessage());
			callbackContext.error(e.getMessage());
            e.printStackTrace();
        }
    }

    private void writeCell(WritableSheet sheet,int col,int row, String value) throws WriteException {
        Label label = new Label(col, row, value);
        sheet.addCell(label);
    }
}